import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareJpeg} from '../cloudflare/jpeg.mjs';
const image=fs.readFileSync(new URL('./fixtures/canvas.jpg',import.meta.url));
test('JPEG canvas: dimensions and removal of APP/COM including GPS metadata',()=>{
 const metadata=Buffer.from('Exif GPS PRIVATE'),comment=Buffer.from('PRIVATE COMMENT');
 const segment=(marker,data)=>Buffer.concat([Buffer.from([255,marker,0,data.length+2]),data]);
 const tagged=Buffer.concat([image.subarray(0,2),segment(225,metadata),segment(254,comment),image.subarray(2)]);
 const clean=prepareJpeg(tagged);
 assert.equal(clean.width,3);assert.equal(clean.height,2);
 assert.ok(!Buffer.from(clean.bytes).includes(Buffer.from('PRIVATE')));
 assert.deepEqual(prepareJpeg(clean.bytes).bytes,clean.bytes);
});
test('JPEG rejects wrong signature, truncated segments, missing EOI and trailing payload',()=>{
 for(const input of [Buffer.from('<script>alert(1)</script>'),image.subarray(0,20),image.subarray(0,-2),Buffer.concat([image,Buffer.from('tail')]),Buffer.from([255,216,255,225,255,255])])assert.throws(()=>prepareJpeg(input));
});
test('JPEG dimensions are bounded and duplicate frames rejected',()=>{
 const copy=Buffer.from(image);const i=copy.indexOf(Buffer.from([255,192]));assert.ok(i>=0);
 copy[i+7]=255;copy[i+8]=255;assert.throws(()=>prepareJpeg(copy));
 const size=image.readUInt16BE(i+2)+2;
 assert.throws(()=>prepareJpeg(Buffer.concat([image.subarray(0,i),image.subarray(i,i+size),image.subarray(i)])));
});
