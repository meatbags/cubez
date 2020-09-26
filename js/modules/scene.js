/** Set up and update world */

import * as THREE from 'three';
import Config from './config';
import Loader from '../loader/loader';
import ColliderSystem from '../collider/collider_system';
import Sky from '../loader/sky';
import CloudMaterial from '../loader/cloud_material';

class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.loader = new Loader('./assets/');
    this.colliderSystem = new ColliderSystem();
  }

  bind(root) {
    this.ref = {};
    this.ref.camera = root.modules.camera;

    // load scene
    this.initMap();
    this.initLighting();
    this.initSky();
  }

  initLighting() {
    this.lights = {
      d1: new THREE.DirectionalLight(0xffffff, 1),
      a1: new THREE.AmbientLight(0xffffff, 0.25),
      p1: new THREE.PointLight(0xffffff, 1, 20, 2),
    };

    this.lights.d1.position.set(0, 0, 0);
    this.lights.d1.target.position.copy(Config.lighting.sunlightDirection);
    this.lights.p1.position.set(0, 6, 0);
    this.lights.p1.position.add(Config.Scene.offset.turret);

    for (const key in this.lights) {
      this.scene.add(this.lights[key]);

      // add directional target
      if (this.lights[key].target) {
        this.scene.add(this.lights[key].target);
      }
    }
  }

  initMap() {
    const maps = ['turret'];
    const collisionMaps = ['turret_map', 'chapel_map', 'basement_map', 'observatory_map', 'garden_map'];

    // apply callback to nested meshes
    const applyToMeshes = (obj, callback) => {
      if (obj.type === 'Mesh') {
        callback(obj);
      } else if (obj.children) {
        obj.children.forEach(child => {
          applyToMeshes(child, callback);
        });
      }
    };

    // load maps
    maps.forEach(name => {
      this.loader.loadFBX(name).then(obj => {
        // apply position offsets
        Object.keys(Config.Scene.offset).forEach(key => {
          if (name.indexOf(key) != -1) {
            const offset = Config.Scene.offset[key];
            applyToMeshes(obj, mesh => { mesh.position.add(offset); });
          }
        });

        // add to scene
        this.scene.add(obj);
      });
    });

    // load collision maps
    collisionMaps.forEach(name => {
      this.loader.loadFBX(name).then(obj => {
        // apply position offsets
        Object.keys(Config.Scene.offset).forEach(key => {
          if (name.indexOf(key) != -1) {
            const offset = Config.Scene.offset[key];
            applyToMeshes(obj, mesh => { mesh.position.add(offset); });
          }
        });

        // add collision maps
        this.colliderSystem.add(obj);
        const wireMat = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true});
        applyToMeshes(obj, mesh => { mesh.material = wireMat; });

        // add to scene
        this.scene.add(obj);
      });
    });
  }

  initSky() {
    // sky
    this.sky = new Sky();
    this.scene.add(this.sky.getMesh());

    // clouds
    if (Config.Scene.cloudComplexity) {
      this.cloudMaterial = CloudMaterial;
      this.cloudMaterial.transparent = true;
      this.cloudMaterial.uniforms.uTime.value = Math.random() * 60;
      this.cloudPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1500, 2000), this.cloudMaterial);
      this.cloudPlane.rotation.x = -Math.PI / 2;
      this.scene.add(this.cloudPlane);
    }
  }

  getScene() {
    return this.scene;
  }

  getColliderSystem() {
    return this.colliderSystem;
  }

  update(delta) {
    // clouds
    if (this.cloudMaterial) {
      this.cloudMaterial.uniforms.uTime.value += delta;
      this.cloudPlane.position.copy(this.ref.camera.getCamera().position);
      this.cloudPlane.position.y -= 40;
    }
  }
}

export default Scene;
