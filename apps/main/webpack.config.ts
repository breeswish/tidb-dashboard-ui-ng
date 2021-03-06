import CopyPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlWebpackTagsPlugin from 'html-webpack-tags-plugin'
import webpack from 'webpack'
import { merge } from 'webpack-merge'
import * as webpackUtils from '@tidb-dashboard/build-scripts/webpack/utils'
import { ROOT_DIR } from '@tidb-dashboard/build-scripts/webpack/utils'
import buildDevServerConfig from './webpack.devServer.config'

function getHtmlScripts() {
  const tags: string[] = []
  {
    const externs = require('@tidb-dashboard/shared-libraries/externs.json')
    const manifest = require('@tidb-dashboard/shared-libraries/build/common/manifest.libs_common.json')
    const manifestKeys = Object.keys(manifest)
    for (const externName of Object.keys(externs)) {
      const key = manifestKeys.find(
        (mk) => mk.indexOf(externName + '.') === 0 && mk.match(/\.js$/)
      )
      if (key) {
        tags.push(manifest[key])
      }
    }
  }
  {
    const manifest = require('@tidb-dashboard/shared-libraries/build/fabric/manifest.libs_fabric')
    tags.push(manifest['fabric.js'])
  }
  {
    const manifest = require('@tidb-dashboard/core/build/manifest.core.json')
    tags.push(manifest['core.js'])
  }
  {
    const manifest = require('@tidb-dashboard/ui/build/lib/manifest.ui_lib.json')
    tags.push(manifest['ui.js'])
  }
  {
    const manifest = require('@tidb-dashboard/ui/build/styles/manifest.ui_styles.json')
    tags.push(manifest['light.css'])
  }
  return {
    append: false,
    tags,
  }
}

export default function config(): webpack.Configuration {
  return merge(
    webpackUtils.buildCommonConfig(__filename),
    webpackUtils.buildLibraryConfig(__filename),
    buildDevServerConfig(),
    {
      entry: {
        app: './src',
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            {
              context: `${ROOT_DIR}/packages/shared-libraries/build/common`,
              from: '**/*',
            },
            {
              context: `${ROOT_DIR}/packages/shared-libraries/build/fabric`,
              from: '**/*',
            },
            {
              context: `${ROOT_DIR}/packages/core/build`,
              from: '**/*',
            },
            {
              context: `${ROOT_DIR}/packages/ui/build/lib`,
              from: '**/*',
            },
            {
              context: `${ROOT_DIR}/packages/ui/build/styles`,
              from: '**/*',
            },
          ],
        }),
        new HtmlWebpackTagsPlugin(getHtmlScripts()),
        new HtmlWebpackPlugin({
          cache: false,
          template: 'public/index.html',
          ...(webpackUtils.NODE_ENV === 'production' && {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }),
        }),
      ],
    }
  )
}
