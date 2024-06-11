import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect } from "react";

export const Map = () => {
  const map = useGLTF("models/battle_map_high.glb");
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
      <RigidBody colliders="trimesh" type="fixed" rotation={[0, 0, 0]} position={[0, -2, 0]}>
        <primitive object={map.scene} />
      </RigidBody>
    </>
  );
};
useGLTF.preload("models/battle_map_high.glb");
