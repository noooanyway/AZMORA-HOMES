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
