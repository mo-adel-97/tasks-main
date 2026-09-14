const path=require('path'),fs=require('fs'),http=require('http'),webpack=require('webpack');
const root=process.cwd(),out=path.join(root,'ui-review','preview-build');
const config={mode:'development',entry:path.join(root,'ui-review/preview.jsx'),output:{path:out,filename:'preview.js'},devtool:false,
  resolve:{extensions:['.js','.jsx'],alias:{[path.join(root,'src/components/NavigationShell')]:path.join(root,'ui-review/PreviewShell.jsx')}},
  module:{rules:[{test:/\.jsx?$/,exclude:/node_modules/,use:{loader:'babel-loader',options:{presets:['@babel/preset-env','@babel/preset-react']}}},
    {test:/\.css$/,use:['style-loader','css-loader']},{test:/\.(jpg|png|webp|svg|mp3|gif|woff2?)$/,type:'asset/resource'}]},
  plugins:[new webpack.DefinePlugin({'process.env.NODE_ENV':JSON.stringify('development')})],optimization:{minimize:false}};
webpack(config,(err,stats)=>{
  if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
  fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مراجعة الواجهة المحلية</title><div id="root"></div><script src="/preview.js"></script></html>');
  http.createServer((req,res)=>{
    const file=path.resolve(out,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(out+path.sep)&&file!==out){res.writeHead(403);res.end();return;}
    const target=fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(out,'index.html');
    res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.html')?'text/html':'application/octet-stream');
    fs.createReadStream(target).pipe(res);
  }).listen(3100,'127.0.0.1',()=>console.log('UI fixture ready at http://127.0.0.1:3100'));
});
