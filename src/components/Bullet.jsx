import { RapierRigidBody, RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useRef } from "react";
import { MeshBasicMaterial } from "three";
import { WEAPON_OFFSET } from "./CharacterController";
import React from "react";

const BULLET_SPEED = 20;

const bulletMaterial = new MeshBasicMaterial({
  color: "hotpink",
  toneMapped: false,
});

bulletMaterial.color.multiplyScalar(42);

export const Bullet = ({ player, dir, position, onHit }) => {
  const rigidbody = useRef();

  useEffect(() => {
    const audio = new Audio("/audios/rifle.mp3");
    audio.play();

    rigidbody.current.setLinvel({ x: dir.x * 10, y: dir.y * 10, z: 0 }, true);
  }, []);

  return (
    <group
      position={[position.x + dir.x * 1.75, position.y + 1.5 + dir.y * 1.75, 0]}
    >
      <RigidBody
        ref={rigidbody}
        gravityScale={0}
        rotation={[0, 0, Math.atan2(dir.y, dir.x)]}
        onIntersectionEnter={(e) => {
          if (isHost() && e.other.rigidBody.userData?.type !== "bullet") {
            rigidbody.current.setEnabled(false);
            onHit(vec3(rigidbody.current.translation()));
          }
        }}
        sensor
        userData={{
          type: "bullet",
          player,
          damage: 10,
        }}
      >
        <mesh position-z={0.25} material={bulletMaterial} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.05]} />
        </mesh>
      </RigidBody>
    </group>
  );
};
