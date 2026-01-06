import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleSystem = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();

        // Explicitly set background color to ensure no white flash
        scene.background = new THREE.Color(0x0a0e27);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 100;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false, // Set to false to support scene background color
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Particles Setup
        const particleCount = 200; // Increased count
        const particles = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities: { x: number; y: number; z: number }[] = [];

        for (let i = 0; i < particleCount * 3; i++) {
            particlePositions[i] = (Math.random() - 0.5) * 200; // x, y, z
        }

        for (let i = 0; i < particleCount; i++) {
            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.2, // Base speed
                y: (Math.random() - 0.5) * 0.2,
                z: (Math.random() - 0.5) * 0.2
            });
        }

        particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00A3E0,
            size: 1.5,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        // Lines for Network Effect
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00A3E0,
            transparent: true,
            opacity: 0.15
        });

        const linesGeometry = new THREE.BufferGeometry();
        // Pre-allocate buffer for lines (max connections assumption)
        // 200 particles, max ~500 lines * 2 points * 3 coords = 3000 (safe upper bound? 200*10 = 2000 lines = 12k floats)
        const maxLines = 1000;
        const linePositions = new Float32Array(maxLines * 2 * 3);
        linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const lines = new THREE.LineSegments(linesGeometry, lineMaterial);
        scene.add(lines);

        // Mouse Interaction
        const mouse = new THREE.Vector2(0, 0);
        const targetMouse = new THREE.Vector2(0, 0);

        const handleMouseMove = (event: MouseEvent) => {
            targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation variables


        // Animation Loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const positions = particles.getAttribute('position').array as Float32Array;

            // Smooth mouse movement
            mouse.lerp(targetMouse, 0.1);

            // Calculate speed based on mouse distance from center (approximate activity) or movement

            // Actually user said "speed up when mouse is over it". Since it covers the whole screen, 
            // maybe speed up based on mouse movement speed? 
            // Or simply proximity to particles. Let's do a global speed up when mouse moves fast
            // For now, let's just use a constant higher speed when mouse is active?
            // User said: "speed up when mouse it over it" -> This implies local mouse interaction.
            // Let's make particles near the mouse move faster or the whole system move faster. 

            // We will accelerate particles slightly towards the mouse and increase global chaos

            // Reset lines
            const linePositions: number[] = [];

            const connectDistance = 30; // Max distance to connect

            // Update Particles
            for (let i = 0; i < particleCount; i++) {
                // Base movement
                let vx = particleVelocities[i].x;
                let vy = particleVelocities[i].y;
                let vz = particleVelocities[i].z;

                // Get current pos
                const px = positions[i * 3];
                const py = positions[i * 3 + 1];
                const pz = positions[i * 3 + 2];

                // Mouse interaction check (in world space approx)
                // Map mouse -1 to 1 to world coords approx -100 to 100
                const mouseWorldX = mouse.x * 100;
                const mouseWorldY = mouse.y * 100;

                const dx = px - mouseWorldX;
                const dy = py - mouseWorldY;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);

                if (distToMouse < 40) {
                    // Accelerate away or orbit? User said "speed up".
                    // Let's increase velocity magnitude
                    vx *= 1.05;
                    vy *= 1.05;
                    vz *= 1.05;

                    // Limit max speed
                    const maxSpeed = 0.8;
                    vx = Math.max(Math.min(vx, maxSpeed), -maxSpeed);
                    vy = Math.max(Math.min(vy, maxSpeed), -maxSpeed);
                    vz = Math.max(Math.min(vz, maxSpeed), -maxSpeed);
                } else {
                    // Dampen back to normal
                    vx *= 0.99;
                    vy *= 0.99;
                    vz *= 0.99;

                    // Restore min speed
                    if (Math.abs(vx) < 0.05) vx = (Math.random() - 0.5) * 0.1;
                    if (Math.abs(vy) < 0.05) vy = (Math.random() - 0.5) * 0.1;
                    if (Math.abs(vz) < 0.05) vz = (Math.random() - 0.5) * 0.1;
                }

                // Apply
                positions[i * 3] += vx;
                positions[i * 3 + 1] += vy;
                positions[i * 3 + 2] += vz;

                // Save new velocity
                particleVelocities[i].x = vx;
                particleVelocities[i].y = vy;
                particleVelocities[i].z = vz;

                // Bounce/Wrap
                if (positions[i * 3] > 100 || positions[i * 3] < -100) particleVelocities[i].x *= -1;
                if (positions[i * 3 + 1] > 100 || positions[i * 3 + 1] < -100) particleVelocities[i].y *= -1;
                if (positions[i * 3 + 2] > 100 || positions[i * 3 + 2] < -100) particleVelocities[i].z *= -1;

                // Connections (O(N^2) but N=200 is fine)
                for (let j = i + 1; j < particleCount; j++) {
                    const p2x = positions[j * 3];
                    const p2y = positions[j * 3 + 1];
                    const p2z = positions[j * 3 + 2];

                    const dist = Math.sqrt(
                        Math.pow(px - p2x, 2) +
                        Math.pow(py - p2y, 2) +
                        Math.pow(pz - p2z, 2)
                    );

                    if (dist < connectDistance) {
                        linePositions.push(px, py, pz);
                        linePositions.push(p2x, p2y, p2z);
                    }
                }
            }

            particles.attributes.position.needsUpdate = true;

            // Update Lines
            linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            // Dispose
            renderer.dispose();
            particles.dispose();
            particleMaterial.dispose();
            linesGeometry.dispose();
            lineMaterial.dispose();
        };
    }, []);

    return <div ref={containerRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-cyber-dark" />;
};

export default ParticleSystem;
