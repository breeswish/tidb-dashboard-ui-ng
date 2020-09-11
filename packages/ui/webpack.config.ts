import path from 'path'
import webpack from 'webpack'
import { merge } from 'webpack-merge'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import ManifestPlugin from 'webpack-manifest-plugin'
import * as webpackUtils from '@tidb-dashboard/build-scripts/webpack/utils'

function libraryConfig(env: webpackUtils.WebpackEnv): webpack.Configuration {
  return merge(
    webpackUtils.buildCommonConfig(env, __filename),
    webpackUtils.buildLibraryConfig(__filename),
    webpackUtils.buildFSCacheConfig(env, __filename),
    webpackUtils.buildWatchConfig(env),
    {
      entry: {
        ui: './src',
      },
      output: {
        path: path.join(__dirname, 'build/lib'),
        library: 'DashboardUi',
        libraryTarget: 'global',
      },
      plugins: [
        new ManifestPlugin({
          fileName: 'manifest.ui_lib.json',
        }),
      ],
    }
  )
}

function styleConfig(env: webpackUtils.WebpackEnv): webpack.Configuration {
  return merge(
    webpackUtils.buildFSCacheConfig(env, __filename),
    webpackUtils.buildWatchConfig(env),
    {
      mode: env,
      context: __dirname,
      entry: {
        light: './styles/full/light.less',
        dark: './styles/full/dark.less',
      },
      output: {
        path: path.join(__dirname, 'build/styles'),
      },
      module: {
        rules: [
          {
            test: /\.less$/,
            use: [
              MiniCssExtractPlugin.loader,
              ...webpackUtils.getCssLoaders(env, {
                importLoaders: 3,
              }),
              ...webpackUtils.getLessLoaders(env),
            ],
            sideEffects: true,
          },
        ],
      },
      plugins: [
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin(),
        new ManifestPlugin({
          fileName: 'manifest.ui_styles.json',
        }),
      ],
    }
  )
}

export default function config(
  env: webpackUtils.WebpackEnv
): webpack.Configuration[] {
  return [libraryConfig(env), styleConfig(env)]
}
