import { Billboard, CameraControls, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CharacterSoldier } from "./CharacterSoldier";
import { Ray } from "three";
import { Raycaster } from "three";
import { isMobile } from "react-device-detect";
import { InputHandlers } from "./Input";
import { AudioPlayer } from "./Audio";

const MOVEMENT_SPEED = 202;
const FIRE_RATE = 380;
const JUMP_DELAY = 500;
export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 0.8,
};

export const playerSize = {
  heigth: 0.7,
  radius: 0.6,
};

export const CharacterController = ({
  state,
  userPlayer,
  onKilled,
  onFire,
  downgradedPerformance,
  ...props
}) => {
  const group = useRef();
  const character = useRef();
  const rigidbody = useRef();
  const [animation, setAnimation] = useState("Idle");
  const [weapon, setWeapon] = useState("AK");
  const lastShoot = useRef(0);
  const lastJump = useRef(0);
  const [angle, setAngle] = useState(0);
  const [dir, setDir] = useState(vec3({ x: 0, y: 0, z: 0 }));
  const { keys, mouse } = InputHandlers();



  const scene = useThree((state) => state.scene);

  const spawn = () => {
    const spawnPoint = [Math.random() * 10 - 5, 3, 0];
    if (rigidbody.current)
    rigidbody.current.setTranslation(spawnPoint.position);
  };

    useLayoutEffect(() => {
      if (isHost()) {
        spawn();
      }
    }, []);

  useFrame((_, delta) => {
    if (!rigidbody.current) return;

    // CAMERA FOLLOW
    if (controls.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
      const playerWorldPos = vec3(rigidbody.current.translation());
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + cameraDistanceY / 3,
        playerWorldPos.z + cameraDistanceZ * 3,
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }


    //Only do for current player
    if (!userPlayer) return;
    const dx = mouse.x - window.innerWidth / 2;
    const dy = window.innerHeight - mouse.y - window.innerHeight / 2;
    const _angle = Math.atan2(dy, dx);
    setAngle();
    // console.log(angle +  (2 * Math.PI) % (Math.PI * 2))
    // Fix negative angles
    if (_angle < 0) setAngle(2 * Math.PI + _angle);
    else setAngle(_angle);

    var shouldMove = true;
    var isShooting = mouse.click;
    var shouldJump = keys[" "];

    // Check if wasd keys are pressed
    var moveDirection = 1;
    if (keys["a"]) moveDirection = Math.PI;
    else if (keys["d"]) moveDirection = 0;
    else shouldMove = false;

    if (shouldMove) {
      // move character in its own direction
      const impulse = {
        x: Math.cos(moveDirection) * MOVEMENT_SPEED * delta,
        y: 0,
        z: 0,
      };
      setAnimation("Run");

      if (isHost())
      rigidbody.current.applyImpulse(impulse, true);
    } else {
      setAnimation("Idle");
    }

    if (angle) {
      // Clamp rotation to 0 and PI
      character.current.rotation.y =
        angle > Math.PI / 2 && angle <= (Math.PI / 2) * 3
          ? (Math.PI / 2) * 3
          : Math.PI / 2;

      const dir = vec3({
        x: Math.cos(angle),
        y: Math.sin(angle),
        z: 0,
      }).normalize();

      setDir(dir);
    }

    // Check if fire button is pressed
    if (isShooting) {
      // fire
      setAnimation(shouldMove && angle ? "Run_Shoot" : "Idle_Shoot");
      if (isHost()) {
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now();
          const newBullet = {
            id: state.id + "-" + +new Date(),
            position: vec3(rigidbody.current.translation()),
            dir: dir,
            player: state.id,
          };
          onFire(newBullet);
        }
      }
    }

    // Check if jump button is pressed
    if (shouldJump) {
      if (Date.now() - lastJump.current < JUMP_DELAY) return;

      // jump

      // Raycast to the ground to check if the player is on the ground
      const rayOrigin = vec3(rigidbody.current.translation());

      const rayDirection = vec3({ x: 0, y: -1, z: 0 }); // direction is down

      const raycaster = new Raycaster(rayOrigin, rayDirection);

      const intersects = raycaster.intersectObjects(scene.children, true);

      const isOnGround = intersects.length > 0 && intersects[0].distance < 0.1;
      if (isOnGround) {
        setAnimation("Jump");
        if (isHost())
        rigidbody.current.applyImpulse({ x: 0, y: 200, z: 0 }, true);
        lastJump.current = Date.now();
      }
    }

    if (isHost()) {
      state.setState("pos", rigidbody.current.translation());
    } else {
      const pos = state.getState("pos");
      console.log(pos);
      if (pos) {
        rigidbody.current.setTranslation(pos);
      }
    }
  });
  const controls = useRef();
  const directionalLight = useRef();

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLight.current.target = character.current;
    }
  }, [character.current]);

  return (
    <>
      <AudioPlayer
        src="/audios/dead.mp3"
        volume={0.5}
        trigger={state.state.dead}
      />
      <AudioPlayer
        src="/audios/hurt.mp3"
        volume={0.4}
        trigger={state.state.health < 100}
      />
      <group {...props} ref={group}>
        {userPlayer && <CameraControls ref={controls} />}
        <RigidBody
          ref={rigidbody}
          colliders={false}
          linearDamping={12}
          lockRotations
          enabledTranslations={[true, true, false]}
          type={isHost() ? "dynamic" : "kinematicPosition"}
          onIntersectionEnter={({ other }) => {
            if (
              isHost() &&
              other.rigidBody.userData.type === "bullet" &&
              state.state.health > 0
            ) {
              const newHealth =
                state.state.health - other.rigidBody.userData.damage;
              if (newHealth <= 0) {
                state.setState("deaths", state.state.deaths + 1);
                state.setState("dead", true);
                state.setState("health", 0);
                rigidbody.current.setEnabled(false);
                setTimeout(() => {
                  spawn();
                  rigidbody.current.setEnabled(true);
                  state.setState("health", 100);
                  state.setState("dead", false);
                }, 2000);
                onKilled(state.id, other.rigidBody.userData.player);
              } else {
                state.setState("health", newHealth);
              }
            }
          }}
        >
          <PlayerInfo state={state.state} />
          <group ref={character}>
            <CharacterSoldier
              color={state.state.profile?.color}
              animation={animation}
              weapon={weapon}
            />
            {userPlayer && <Crosshair offset={dir} />}
          </group>
          {userPlayer && (
            // Finally I moved the light to follow the player
            // This way we won't need to calculate ALL the shadows but only the ones
            // that are in the camera view
            <directionalLight
              ref={directionalLight}
              position={[25, 18, -25]}
              intensity={0.3}
              castShadow={!downgradedPerformance} // Disable shadows on low-end devices
              shadow-camera-near={0}
              shadow-camera-far={100}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
            />
          )}
          <CapsuleCollider
            args={[playerSize.heigth, playerSize.radius]}
            position={[0, 1.28, 0]}
          />
        </RigidBody>
      </group>
    </>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};

const Crosshair = ({ offset, props }) => {
  return (
    <group {...props}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 1.5 + offset.y * (i + 1), Math.abs(offset.x * (i + 1))]}
        >
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.9 - i * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
};
