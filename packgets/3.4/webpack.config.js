const path = require('path');

// html模板
const HtmlWebpackPlugin = require('html-webpack-plugin');

// 将ext复制到dist中
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 用了hash命名，所以需要清理文件夹
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[hash].js'
    },
    module: {
        rules: [

            // 打包es6语法
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    require.resolve('style-loader'),
                    {
                        loader: require.resolve('css-loader'),
                        options: {
                            importLoaders: 1,
                        },
                    },
                ],
            },
            {
                test: /\.stylus$/,
                loader: [
                    require.resolve('style-loader'),
                    require.resolve('css-loader'),
                    require.resolve('stylus-loader')
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'static/images/[name].[hash:8].[ext]',
                            useCache:true//构建缓存
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.join(__dirname, 'public/index.html'),
        }),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, 'public/ext'),
                to: path.join(__dirname, 'dist/ext')
            }
        ]),
        new CleanWebpackPlugin(),
    ],
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000
    }
};
