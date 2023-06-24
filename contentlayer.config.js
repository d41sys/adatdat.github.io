import fs from 'fs';
import path from 'path';
import { defineDocumentType, defineNestedType, makeSource } from 'contentlayer/source-files';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import { codeImport } from 'remark-code-import';
import remarkGfm from 'remark-gfm';
import { getHighlighter, loadTheme } from 'shiki';
import { visit } from 'unist-util-visit';
import readingTime from 'reading-time';

import { rehypeComponent } from './lib/rehype-component';
import { rehypeNpmCommand } from './lib/rehype-npm-command';

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: 'string',
    resolve: (article) => `/${article._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: 'string',
    resolve: (article) => article._raw.flattenedPath.split('/').slice(1).join('/'),
  },
  wordCount: {
    type: 'number',
    resolve: (article) => article.body.raw.split(/\s+/gu).length,
  },
  readingTime: { type: 'json', resolve: (article) => readingTime(article.body.raw) },
};

const RadixProperties = defineNestedType(() => ({
  name: 'RadixProperties',
  fields: {
    link: {
      type: 'string',
    },
    api: {
      type: 'string',
    },
  },
}));

export const Article = defineDocumentType(() => ({
  name: 'Articles',
  filePathPattern: `articles/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    id: {
      type: 'number',
      default: 9999,
      required: true,
    },
    title: {
      type: 'string',
      description: 'The title of this article',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    published: {
      type: 'boolean',
      default: true,
    },
    radix: {
      type: 'nested',
      of: RadixProperties,
    },
    img: {
      type: 'string',
      required: false,
      default:
        'https://images.pexels.com/photos/1420769/pexels-photo-1420769.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    featured: {
      type: 'boolean',
      default: false,
      required: false,
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      required: false,
      default: ["Normal"]
    },
    time: {
      type: 'string',
      required: false,
    },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Article],
  mdx: {
    remarkPlugins: [remarkGfm, codeImport],
    rehypePlugins: [
      rehypeSlug,
      rehypeComponent,
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'pre') {
            const [codeEl] = node.children;
            if (codeEl.tagName !== 'code') {
              return;
            }

            if (codeEl.data?.meta) {
              // Extract event from meta and pass it down the tree.
              const regex = /event="([^"]*)"/;
              const match = codeEl.data?.meta.match(regex);
              if (match) {
                node.__event__ = match ? match[1] : null;
                codeEl.data.meta = codeEl.data.meta.replace(regex, '');
              }
            }

            node.__rawString__ = codeEl.children?.[0].value;
            node.__src__ = node.properties?.__src__;
          }
        });
      },
      [
        rehypePrettyCode,
        {
          theme: {
            dark: JSON.parse(fs.readFileSync(path.resolve('./lib/themes/dark.json'), 'utf-8')),
            light: JSON.parse(fs.readFileSync(path.resolve('./lib/themes/light.json'), 'utf-8')),
          },
          // getHighlighter: async () => {
          //   const theme = await loadTheme(
          //     path.join(process.cwd(), "lib/vscode-theme.json")
          //   )
          //   return await getHighlighter({ theme })
          // },
          onVisitLine(node) {
            // Prevent lines from collapsing in `display: grid` mode, and allow empty
            // lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push('line--highlighted');
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ['word--highlighted'];
          },
        },
      ],
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'div') {
            if (!('data-rehype-pretty-code-fragment' in node.properties)) {
              return;
            }

            const preElement = node.children.at(-1);
            if (preElement.tagName !== 'pre') {
              return;
            }

            preElement.properties['__withMeta__'] = node.children.at(0).tagName === 'div';
            preElement.properties['__rawString__'] = node.__rawString__;

            if (node.__src__) {
              preElement.properties['__src__'] = node.__src__;
            }

            if (node.__event__) {
              preElement.properties['__event__'] = node.__event__;
            }
          }
        });
      },
      rehypeNpmCommand,
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['subheading-anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
    ],
  },
});
