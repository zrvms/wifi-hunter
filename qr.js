function qrMatrix(message){
  const n=53, size=232, dataBytes=[];for(const c of message){const x=c.codePointAt(0);if(x<128)dataBytes.push(x);else if(x<2048)dataBytes.push(192|(x>>6),128|(x&63));else if(x<65536)dataBytes.push(224|(x>>12),128|((x>>6)&63),128|(x&63));else dataBytes.push(240|(x>>18),128|((x>>12)&63),128|((x>>6)&63),128|(x&63))}
  const unicode=dataBytes.some(v=>v>127);if(dataBytes.length>(unicode?229:230))throw Error('Слишком длинные данные для QR-кода.');
  const bits=[];function put(v,k){for(let i=k-1;i>=0;i--)bits.push((v>>>i)&1)}
  if(unicode){put(7,4);put(26,8)}put(4,4);put(dataBytes.length,8);for(const v of dataBytes)put(v,8);
  put(0,Math.min(4,size*8-bits.length));while(bits.length%8)bits.push(0);
  const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>a*2+b,0));for(let k=0;data.length<size;k++)data.push(k%2?17:236);
  function mul(x,y){let z=0;while(y){if(y&1)z^=x;y>>>=1;x=(x<<1)^((x&128)?285:0)}return z}
  let poly=[1],root=1;for(let i=0;i<30;i++){const p=new Array(poly.length+1).fill(0);poly.forEach((v,j)=>{p[j]^=v;p[j+1]^=mul(v,root)});poly=p;root=mul(root,2)}
  const blocks=[data.slice(0,116),data.slice(116)];const ecc=blocks.map(d=>{const a=d.concat(new Array(30).fill(0));for(let i=0;i<d.length;i++){const f=a[i];for(let j=0;j<poly.length;j++)a[i+j]^=mul(poly[j],f)}return a.slice(-30)});
  const code=[];for(let i=0;i<116;i++)for(const b of blocks)code.push(b[i]);for(let i=0;i<30;i++)for(const b of ecc)code.push(b[i]);
  const m=Array.from({length:n},()=>Array(n).fill(null));function set(x,y,v){if(x>=0&&y>=0&&x<n&&y<n)m[y][x]=Boolean(v)}
  for(const [cx,cy] of [[3,3],[n-4,3],[3,n-4]])for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));set(cx+dx,cy+dy,d!==2&&d!==4)}
  for(const y of [6,26,46])for(const x of [6,26,46]){if(m[y][x]!==null)continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(x+dx,y+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
  for(let i=8;i<n-8;i++){if(m[6][i]===null)set(i,6,i%2===0);if(m[i][6]===null)set(6,i,i%2===0)}
  const format=0x77c4;const bit=(v,i)=>(v>>>i)&1;
  for(let i=0;i<=5;i++)set(8,i,bit(format,i));set(8,7,bit(format,6));set(8,8,bit(format,7));set(7,8,bit(format,8));for(let i=9;i<15;i++)set(14-i,8,bit(format,i));
  for(let i=0;i<8;i++)set(n-1-i,8,bit(format,i));for(let i=8;i<15;i++)set(8,n-15+i,bit(format,i));set(8,n-8,1);
  let rem=9;for(let i=0;i<12;i++)rem=(rem<<1)^(((rem>>>11)&1)*0x1f25);const version=(9<<12)|rem;
  for(let i=0;i<18;i++){const a=n-11+i%3,b=Math.floor(i/3);set(a,b,bit(version,i));set(b,a,bit(version,i))}
  let pos=0;for(let right=n-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<n;v++){const y=(((right+1)&2)===0)?n-1-v:v;for(let j=0;j<2;j++){const x=right-j;if(m[y][x]!==null)continue;const b=pos<code.length*8?bit(code[pos>>>3],7-(pos&7)):0;set(x,y,b^Number((x+y)%2===0));pos++}}}
  if(pos!==code.length*8)throw Error('QR data count '+pos);return m;
}
