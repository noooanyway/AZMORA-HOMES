import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicModels} from '../cloudflare/public-models.mjs';
const unit=(id,state,publish=true,group='Modelo')=>({id,media_slug:id,name_for_site:id,availability:state,publish,inventory_group:group,reference_azmora:'privada'});
test('One public model, stable URL, no internal group/reference/counts',()=>{
 const {houses,aliases}=publicModels([unit('a','vendido'),unit('b','reservado'),unit('c','disponivel')]);
 assert.equal(houses.length,1);assert.equal(houses[0].media_slug,'a');assert.equal(houses[0].availability,'disponivel');assert.equal(aliases.get('c'),'a');
 assert.equal(houses[0].inventory_group,undefined);assert.equal(houses[0].reference_azmora,undefined);assert.equal(houses[0].quantity,undefined);
});
test('Unpublished stock cannot expose a draft or change public availability',()=>{
 const {houses,aliases}=publicModels([unit('a','vendido'),unit('b','disponivel',false)]);
 assert.equal(houses[0].availability,'vendido');assert.equal(aliases.size,0);
});
test('No implicit grouping; normalized explicit groups; all-sold model remains sold',()=>{
 assert.equal(publicModels([unit('a','vendido',true,''),unit('b','vendido',true,'')]).houses.length,2);
 const result=publicModels([unit('a','vendido'),unit('b','vendido',true,' MODELO ')]);
 assert.equal(result.houses.length,1);assert.equal(result.houses[0].availability,'vendido');
});

test('Mixed stock appears once per category, with the same canonical URL and no quantities',()=>{
 const units=[unit('a','disponivel'),unit('b','disponivel'),unit('c','reservado'),{...unit('d','vendido'),sale_order:12},{...unit('e','vendido'),sale_order:19}];
 for(const category of ['disponivel','reservado','vendido']){
  const {houses}=publicModels(units,category);
  assert.equal(houses.length,1);assert.equal(houses[0].media_slug,'a');assert.equal(houses[0].availability,category);
  assert.equal(houses[0].inventory_group,undefined);assert.equal(houses[0].quantity,undefined);
 }
 assert.equal(publicModels(units,'vendido').houses[0].sale_order,19);
 units[0].availability='vendido';units[1].availability='reservado';
 assert.equal(publicModels(units,'disponivel').houses.length,0);
 assert.equal(publicModels(units,'reservado').houses.length,1);
 assert.equal(publicModels(units,'vendido').houses.length,1);
});
test('Draft reservations and sales do not appear in public categories',()=>{
 const units=[unit('a','disponivel'),unit('b','reservado',false),unit('c','vendido',false)];
 assert.equal(publicModels(units,'reservado').houses.length,0);
 assert.equal(publicModels(units,'vendido').houses.length,0);
});
