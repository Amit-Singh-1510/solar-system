import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./style/App.css"; // Assuming you have a CSS file for styles

const planetsData = [
  { name: "Mercury", color: 0xaaaaaa, size: 0.3, distance: 4, speed: 0.04 },
  { name: "Venus", color: 0xffaa00, size: 0.5, distance: 6, speed: 0.015 },
  { name: "Earth", color: 0x3399ff, size: 0.6, distance: 8, speed: 0.01 },
  { name: "Mars", color: 0xff3300, size: 0.5, distance: 10, speed: 0.008 },
  { name: "Jupiter", color: 0xffcc99, size: 1.1, distance: 13, speed: 0.004 },
  { name: "Saturn", color: 0xffff99, size: 1.0, distance: 16, speed: 0.003 },
  { name: "Uranus", color: 0x99ffff, size: 0.8, distance: 19, speed: 0.002 },
  { name: "Neptune", color: 0x4444ff, size: 0.8, distance: 22, speed: 0.0015 },
];

function App() {
  const mountRef = useRef(null);
  const tooltipRef = useRef(null);

  const [speeds, setSpeeds] = useState(() =>
    Object.fromEntries(planetsData.map((p) => [p.name, p.speed]))
  );
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const light = new THREE.PointLight(0xffffff, 2, 0);
    light.position.set(0, 0, 0);
    scene.add(light);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const starPositions = [];
    for (let i = 0; i < starCount; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const starField = new THREE.Points(starsGeometry, starMaterial);
    scene.add(starField);

    // Planets setup
    const planets = planetsData.map((data) => {
      const geo = new THREE.SphereGeometry(data.size, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: data.color });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return { mesh, data: { ...data, angle: Math.random() * Math.PI * 2 } };
    });

    // Raycaster and mouse for tooltip
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planets.map((p) => p.mesh));

      if (intersects.length > 0) {
        const planet = planets.find((p) => p.mesh === intersects[0].object);
        if (planet && tooltipRef.current) {
          tooltipRef.current.style.left = event.clientX + 10 + "px";
          tooltipRef.current.style.top = event.clientY + 10 + "px";
          tooltipRef.current.innerHTML = planet.data.name;
          tooltipRef.current.style.display = "block";
        }
      } else {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      }
    }
    window.addEventListener("mousemove", onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (!isPaused) {
        planets.forEach(({ mesh, data }) => {
          data.angle += speeds[data.name];
          mesh.position.x = Math.cos(data.angle) * data.distance;
          mesh.position.z = Math.sin(data.angle) * data.distance;
        });
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [speeds, isPaused]);

  // Speed slider change handler
  function handleSpeedChange(name, val) {
    setSpeeds((prev) => ({ ...prev, [name]: parseFloat(val) }));
  }

  return (
    <>
      <div id="controls">
        {planetsData.map((p, i) => (
          <label key={p.name}>
            {p.name}:{" "}
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={speeds[p.name]}
              onChange={(e) => handleSpeedChange(p.name, e.target.value)}
            />
          </label>
        ))}
        <button
          id="pauseBtn"
          onClick={() => setIsPaused((paused) => !paused)}
          style={{ marginTop: "10px" }}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
      <div className="tooltip" ref={tooltipRef}></div>
    </>
  );
}

export default App;
