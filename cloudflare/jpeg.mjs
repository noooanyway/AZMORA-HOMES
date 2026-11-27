// Accept a bounded, single JPEG image and remove APP/COM metadata, including EXIF/GPS.
export function prepareJpeg(bytes) {
  const fail = () => { throw Error('Fotografia JPEG inválida ou incompleta.'); };
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) fail();
  const chunks = [bytes.subarray(0, 2)];
  let pos = 2, dimensions, scans = 0, ended = false;
  while (pos < bytes.length) {
    const start = pos;
    if (bytes[pos++] !== 255) fail();
    while (bytes[pos] === 255) pos++;
    const marker = bytes[pos++];
    if (marker === 217) {
      if (!dimensions || !scans || pos !== bytes.length) fail();
      chunks.push(bytes.subarray(start,pos)); ended = true; break;
    }
    if (pos + 2 > bytes.length) fail();
    const length = bytes[pos] * 256 + bytes[pos+1], end = pos + length;
    if (length < 2 || end > bytes.length) fail();
    if (marker === 192 || marker === 194) {
      if (dimensions || length < 11 || bytes[pos+2] !== 8) fail();
      const components = bytes[pos+7];
      if (![1,3].includes(components) || length !== 8 + 3 * components) fail();
      const height=bytes[pos+3]*256+bytes[pos+4], width=bytes[pos+5]*256+bytes[pos+6];
      if (!width || !height || Math.max(width,height)>1800) fail();
      dimensions={width,height};
    } else if (![196,219,221,218,254].includes(marker) && !(marker>=224 && marker<=239)) fail();
    if (marker === 221 && length !== 4) fail();
    if (!(marker>=224 && marker<=239) && marker !== 254) chunks.push(bytes.subarray(start,end));
    pos=end;
    if (marker === 218) {
      if (!dimensions || length < 6 || length !== 6 + 2 * bytes[end-length+2]) fail();
      scans++;
      const entropyStart=pos;
      while(pos<bytes.length){
        if(bytes[pos]!==255){pos++;continue;}
        let next=pos+1;while(bytes[next]===255)next++;
        if(bytes[next]===0 || (bytes[next]>=208 && bytes[next]<=215)){pos=next+1;continue;}
        break;
      }
      if(pos===entropyStart)fail();
      chunks.push(bytes.subarray(entropyStart,pos));
    }
  }
  if(!ended)fail();
  const clean=new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));
  let offset=0;for(const chunk of chunks){clean.set(chunk,offset);offset+=chunk.length;}
  return {bytes:clean,...dimensions};
}
