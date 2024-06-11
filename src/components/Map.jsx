import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect } from "react";

export const Map = () => {
  const map = useGLTF("models/map.glb");
  useEffect(() => {
    map.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
  return (
    <>
      <RigidBody colliders="trimesh" type="fixed">
        <primitive object={map.scene} />

         {/* <mesh >
              <boxGeometry args={[10, 10, 2]} />
         </mesh> */}
      </RigidBody>
    </>
  );
};
useGLTF.preload("models/map.glb");
