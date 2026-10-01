import { useEffect, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { saveWorkspaceCamera } from './workspaceUiSlice';
export const useWorkspaceCamera = (id: 'atlas' | 'links') => {
    const dispatch = useAppDispatch();
    const pose = useAppSelector(state => state.workspaceUi.cameras[id]);
    const scene = useRef<{
        camera: PerspectiveCamera;
        controls: OrbitControls;
    } | null>(null);
    useEffect(() => {
        if (!pose || !scene.current)
            return;
        const { camera, controls } = scene.current;
        camera.position.fromArray(pose.position);
        camera.zoom = pose.zoom;
        controls.target.fromArray(pose.target);
        camera.updateProjectionMatrix();
        controls.update();
    }, [pose]);
    const poseRef = useRef(pose);
    useEffect(() => { poseRef.current = pose; }, [pose]);
    const bindRef = useRef((camera: PerspectiveCamera, controls: OrbitControls) => {
        scene.current = { camera, controls };
        const saved = poseRef.current;
        if (saved) {
            camera.position.fromArray(saved.position);
            camera.zoom = saved.zoom;
            controls.target.fromArray(saved.target);
            camera.updateProjectionMatrix();
            controls.update();
        }
        const save = () => dispatch(saveWorkspaceCamera({ id, pose: { position: camera.position.toArray(), target: controls.target.toArray(), zoom: camera.zoom } }));
        controls.addEventListener('end', save);
        return () => { controls.removeEventListener('end', save); scene.current = null; };
    });
    return bindRef;
};
