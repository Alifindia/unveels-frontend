import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BufferGeometry, Points, PointsMaterial, Line, LineBasicMaterial, Float32BufferAttribute } from "three";
import { Landmark } from "../../../types/landmark";

interface WatchProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HandVisualizer: React.FC<WatchProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const { scene, viewport } = useThree();
    const pointMeshRef = useRef<Points | null>(null);
    const lineMeshRef = useRef<Line | null>(null);

    useFrame(() => {
      if (!handLandmarks.current) return;

      const points = new BufferGeometry();
      const positions = [];

      const outputWidth = planeSize[0];
      const outputHeight = planeSize[1];

      // Transform landmarks to match canvas size with x flipped
      handLandmarks.current.forEach(landmark => {
        const x = -(landmark.x - 0.5) * outputWidth;
        const y = -(landmark.y - 0.5) * outputHeight;
        const z = -landmark.z * outputWidth; // Adjust Z scaling if necessary

        positions.push(x, y, z);
      });

      points.setAttribute('position', new Float32BufferAttribute(positions, 3));

      // Create new point and line meshes
      const pointMaterial = new PointsMaterial({ color: 0xff0000, size: 10 });
      const pointMesh = new Points(points, pointMaterial);

      const lineMaterial = new LineBasicMaterial({ color: 0x0000ff });
      const lineMesh = new Line(points, lineMaterial);

      // Remove previous meshes if they exist
      if (pointMeshRef.current) {
        scene.remove(pointMeshRef.current);
      }
      if (lineMeshRef.current) {
        scene.remove(lineMeshRef.current);
      }

      // Add new meshes to the scene
      scene.add(pointMesh);
      scene.add(lineMesh);

      // Store the references to the new meshes
      pointMeshRef.current = pointMesh;
      lineMeshRef.current = lineMesh;
    });

    // Cleanup when the component is unmounted
    useEffect(() => {
      return () => {
        if (pointMeshRef.current) {
          scene.remove(pointMeshRef.current);
        }
        if (lineMeshRef.current) {
          scene.remove(lineMeshRef.current);
        }
      };
    }, [scene]);

    return null;
  },
);

const Watch: React.FC<WatchProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <HandVisualizer {...props} />
    </Suspense>
  );
};

export default Watch;