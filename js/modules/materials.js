/** Material handler */

import * as THREE from 'three';
import GLSLPerlinNoise from '../util/glsl_perlin_noise';

class Materials {
  constructor() {
    const envMapSources = ['pos_x', 'neg_x', 'pos_y', 'neg_y', 'pos_z', 'neg_z'].map(filename => `assets/envmap/${filename}.jpg`);
    this.envMap = new THREE.CubeTextureLoader().load(envMapSources);
    this.materials = [];
    this.uniforms = {time: {value: 0}};
  }

  processObject(obj) {
    if (obj.type == 'Mesh') {
      if (this.requiresCustomMaterial(obj.material)) {
        obj.material = this.createCustomMaterial(obj.material);
      }
      this.processMaterial(obj.material);
    } else if (obj.children) {
      obj.children.forEach(child => {
        this.processObject(child);
      });
    }
  }

  processMaterial(mat) {
    if (mat.id !== undefined && this.materials.find(m => m.id === mat.id) !== undefined) {
      return;
    }

    // register
    this.materials.push(mat);

    // add environment map
    mat.envMap = this.envMap;
    mat.envMapIntensity = 0.25;

    // material-specific settings
    if (mat.name === 'fabric') {
      mat.side = THREE.DoubleSide;
      mat.alphaMap = mat.map;
      mat.transparent = true;
    }
  }

  requiresCustomMaterial(mat) {
    return mat.name === 'fabric';
  }

  createCustomMaterial(material) {
    let uniforms = '';
    let funcs = '';
    let vertexShader = '';

    // fabric
    if (material.name === 'fabric') {
      uniforms = `
        uniform float time;
      `;
      funcs = GLSLPerlinNoise;
      vertexShader = `
        float t = time * 0.25;
        vec3 p = position;
        float x = (p.x + t) * 2.0;
        float y = (p.y + t) * 0.5;
        float pz = perlinNoise(vec2(x, y)) * 0.25;
        float pz_scale = clamp((5.0 - p.y) / 5.0, 0.0, 1.0);
        vec3 transformed = vec3(p.x, p.y, p.z + pz * pz_scale);
        // vNormal = vNormal * pz;
      `;
    }

    // create custom material
    const mat = material.clone();
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = `${uniforms}\n${funcs}\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', vertexShader);
      shader.uniforms.time = this.uniforms.time;
    };

    return mat;
  }

  setAlphaMap(material, map) {
    //material.color.setHex(0xffffff);
    material.alphaMap = map;
    // material.transparent = true;
    // material.side = THREE.DoubleSide;
    // material.depthWrite = false;
    // material.blending = THREE.AdditiveBlending;
  }

  update(delta) {
    this.uniforms.time.value += delta;
  }
}

export default Materials;
