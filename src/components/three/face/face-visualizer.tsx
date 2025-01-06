import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BufferGeometry, Points, PointsMaterial, Line, LineBasicMaterial, Float32BufferAttribute } from "three";
import { Landmark } from "../../../types/landmark";

interface WatchProps extends MeshProps {
  faceLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const FaceVisualizer: React.FC<WatchProps> = React.memo(
  ({ faceLandmarks, planeSize }) => {
    const { scene, viewport } = useThree();
    const pointMeshRef = useRef<Points | null>(null);
    const lineMeshRef = useRef<Line | null>(null);

    useFrame(() => {
      if (!faceLandmarks.current) return;

      const points = new BufferGeometry();
      const positions = [];

      const outputWidth = planeSize[0];
      const outputHeight = planeSize[1];

      // Transform landmarks to match canvas size with x flipped
      faceLandmarks.current.forEach(landmark => {
        const x = -(landmark.x - 0.5) * outputWidth;
        const y = -(landmark.y - 0.5) * outputHeight;
        const z = -landmark.z * 100; // Adjust Z scaling if necessary

        positions.push(x, y, z);
      });

      points.setAttribute('position', new Float32BufferAttribute(positions, 3));

      // Create new point and line meshes
      const pointMaterial = new PointsMaterial({ color: 0xff0000, size: 5 });
      const pointMesh = new Points(points, pointMaterial);

      const lineMaterial = new LineBasicMaterial({ color: 0x0000ff });

      // Define face mesh connections (example: lines between certain points)
      const faceConnections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Jawline
        [5, 6], [6, 7], [7, 8], // Eyebrow connections
        [9, 10], [10, 11], [11, 12], // Nose connections
        [13, 14], [14, 15], // Mouth connections
        // Add more connections based on face mesh landmark indices
      ];

      const lineGeometry = new BufferGeometry();
      const linePositions: number[] = [];

      faceConnections.forEach(([startIdx, endIdx]) => {
        const start = positions.slice(startIdx * 3, startIdx * 3 + 3);
        const end = positions.slice(endIdx * 3, endIdx * 3 + 3);

        linePositions.push(...start, ...end);
      });

      lineGeometry.setAttribute('position', new Float32BufferAttribute(linePositions, 3));
      const lineMesh = new Line(lineGeometry, lineMaterial);

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
      <FaceVisualizer {...props} />
    </Suspense>
  );
};

export default Watch;
