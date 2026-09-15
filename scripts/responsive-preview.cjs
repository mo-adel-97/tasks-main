const fs=require('fs'),path=require('path'),http=require('http'),webpack=require('webpack');
const root=process.cwd(),out=path.join(root,'ui-review/responsive/preview-build');
webpack({mode:'development',entry:path.join(root,'ui-review/responsive/preview.jsx'),output:{path:out,filename:'preview.js'},devtool:false,
  resolve:{extensions:['.js','.jsx'],alias:{[path.join(root,'src/components/Sidebar')]:path.join(root,'ui-review/responsive/SidebarFixture.jsx')}},
  module:{rules:[{test:/\.jsx?$/,exclude:/node_modules/,use:{loader:'babel-loader',options:{presets:['@babel/preset-env','@babel/preset-react']}}},{test:/\.css$/,use:['style-loader','css-loader']},{test:/\.(jpg|png|webp|svg|mp3|gif|woff2?)$/,type:'asset/resource'}]},
  plugins:[new webpack.DefinePlugin({'process.env':JSON.stringify({NODE_ENV:'development',REACT_APP_API_BASE_URL:'http://127.0.0.1:3101',REACT_APP_API_URL:'http://127.0.0.1:3101'})})],optimization:{minimize:false}
},(err,stats)=>{
  if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
  fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/preview.js"></script></html>');
  http.createServer((req,res)=>{const candidate=path.resolve(out,'.'+new URL(req.url,'http://localhost').pathname);if(!candidate.startsWith(out+path.sep)&&candidate!==out){res.writeHead(403);res.end();return;}const file=fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(out,'index.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).pipe(res);}).listen(3101,'127.0.0.1',()=>console.log('Responsive fixture http://127.0.0.1:3101'));
});
