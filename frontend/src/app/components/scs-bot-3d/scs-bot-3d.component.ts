import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type CoreShape = 'helix' | 'tesseract' | 'quantum';

// Pre-allocated math helpers at module scope (zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _riderPos = new THREE.Vector3();
const _riderTan = new THREE.Vector3();
const _candPos = new THREE.Vector3();
const _candTan = new THREE.Vector3();
const _bestPos = new THREE.Vector3();
const _bestTan = new THREE.Vector3();
const _lookMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();
const _tiltQuat = new THREE.Quaternion();
const _origin = new THREE.Vector3(0, 0, 0);

interface DataPacket {
  curveIndex: number;
  offset: number;
  speed: number;
  baseScale: number;
}

@Component({
  selector: 'app-scs-bot-3d',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Borderless 3D SoftCode Business Innovation Showcase on Clean White Canvas -->
    <div class="relative w-full flex flex-col items-center select-none">

      <!-- 3D WebGL Viewport (Zero Box / Zero Card Frame) -->
      <div
        #canvasContainer
        class="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-visible"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointerleave)="onPointerLeave()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onPointerLeave()"
      >
        @if (webglUnavailable()) {
          <div class="flex flex-col items-center justify-center gap-3 text-slate-600 p-8 text-center">
            <div class="w-24 h-24 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shadow-sm">
              <span class="font-mono font-bold text-2xl text-slate-900 tracking-tighter">(&lt;/&gt;)</span>
            </div>
            <span class="text-xs font-medium text-slate-500">SoftCode Commerce Engine</span>
          </div>
        }

      </div>

      <!-- Clean SCS Core Metallic Nameplate with Inverted Specular Mirror Reflection -->
      <div class="relative flex flex-col items-center mt-2 z-10">
        <h3
          class="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight bg-gradient-to-b from-slate-950 via-slate-800 to-slate-600 bg-clip-text text-transparent uppercase font-mono drop-shadow-xs whitespace-nowrap"
        >
          SCS Core
        </h3>

        <!-- Specular Inverted Mirror Reflection on White Studio Floor -->
        <div
          aria-hidden="true"
          class="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight bg-gradient-to-t from-transparent via-blue-600/20 to-slate-800/35 bg-clip-text text-transparent select-none pointer-events-none transform scale-y-[-1] origin-top opacity-40 -mt-2.5 sm:-mt-3 blur-[0.6px] font-mono whitespace-nowrap [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0)_75%)]"
        >
          SCS Core
        </div>

        <p class="text-xs text-slate-500 font-medium tracking-wide mt-2 whitespace-nowrap">
          Autonomous Commerce Architecture · Multi-Tenant Mesh
        </p>
      </div>

    </div>
  `
})
export class ScsBot3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  private ngZone = inject(NgZone);
  webglUnavailable = signal(false);
  activeShape = signal<CoreShape>('helix');

  // Core Three.js state
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameId: number = 0;
  private isDestroyed = false;
  private isSoftwareGl = false;
  private prefersReducedMotion = false;

  // Shared Master & Core Emblem
  private masterGroup = new THREE.Group();
  private sharedGlyphGroup = new THREE.Group();

  // Shape 1: Helix Engine
  private helixGroup = new THREE.Group();
  private helixCrownGroup = new THREE.Group();
  private helixBaseGroup = new THREE.Group();
  private helixEquatorialRing = new THREE.Group();
  private helixCurves: THREE.CatmullRomCurve3[] = [];
  private helixPacketsMesh!: THREE.InstancedMesh;
  private helixPackets: DataPacket[] = [];

  // Traveling Header (</>) Logo Medallion & Multi-Track Transfer State
  private helixRiderGroup = new THREE.Group();
  private riderTrack = 0;
  private riderT = 0.04;
  private riderDir = 1;
  private riderTimeOnTrack = 0;
  private riderVisitCounter = 1;
  private riderLastVisited: number[] = [1, 0, 0, 0, 0];
  private riderTransitionBlend = 1;
  private riderFromPos = new THREE.Vector3();
  private riderFromQuat = new THREE.Quaternion();
  private riderPulse = 0;

  // Shape 2: Vault Cube (Tesseract)
  private tesseractGroup = new THREE.Group();
  private tesseractOuterFrame = new THREE.Group();
  private tesseractInnerCube!: THREE.Mesh;
  private tesseractInnerEdges!: THREE.LineSegments;
  private tesseractCurves: THREE.CatmullRomCurve3[] = [];
  private tesseractPacketsMesh!: THREE.InstancedMesh;
  private tesseractPackets: DataPacket[] = [];

  // Shape 3: Quantum Core (Original 3-Ring Gyroscope)
  private quantumGroup = new THREE.Group();
  private qCrystalMesh!: THREE.Mesh;
  private qCrystalEdges!: THREE.LineSegments;
  private qRing1 = new THREE.Group();
  private qRing2 = new THREE.Group();
  private qRing3 = new THREE.Group();
  private qSatellitesGroup = new THREE.Group();
  private qSatelliteMeshes: THREE.Mesh[] = [];
  private qFilamentLines!: THREE.LineSegments;
  private qFilamentPositions!: Float32Array;
  private qCurves: THREE.CatmullRomCurve3[] = [];
  private qPacketsMesh!: THREE.InstancedMesh;
  private qPackets: DataPacket[] = [];

  // Shared PBR Materials
  private titaniumMat!: THREE.MeshPhysicalMaterial;
  private cobaltMat!: THREE.MeshPhysicalMaterial;
  private silverMat!: THREE.MeshPhysicalMaterial;
  private glassMat!: THREE.MeshPhysicalMaterial;
  private packetMat!: THREE.MeshPhysicalMaterial;

  // Interactive 360-degree Rotation & Cursor Tracking State
  private mouseTargetX = 0;
  private mouseTargetY = 0;
  private mouseCurrentX = 0;
  private mouseCurrentY = 0;
  private isPointerHovering = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private manualRotY = 0;
  private manualRotX = 0;
  private autoCruiseY = 0;

  private clock = new THREE.Clock();
  private contextLostHandler = (e: Event) => {
    e.preventDefault();
    this.stopLoop();
  };
  private contextRestoredHandler = () => {
    if (!this.isDestroyed) {
      this.startLoop();
    }
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      this.initThreeScene();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.stopLoop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.renderer) {
      const dom = this.renderer.domElement;
      dom.removeEventListener('webglcontextlost', this.contextLostHandler);
      dom.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
      this.renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    }

    if (this.envRT) {
      this.envRT.dispose();
      this.envRT = null;
    }

    this.disposeHierarchy(this.scene);
  }

  selectShape(shape: CoreShape): void {
    this.activeShape.set(shape);
    this.applyActiveShapeVisibility(shape);
    if (this.prefersReducedMotion && this.renderer) {
      this.updateScene(0, this.clock.getElapsedTime());
      this.renderer.render(this.scene, this.camera);
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.isPointerHovering = true;
  }

  onPointerMove(event: PointerEvent): void {
    if (this.isDragging) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      this.manualRotY += deltaX * 0.011;
      this.manualRotX += deltaY * 0.009;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      return;
    }

    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.mouseTargetX = nx * 1.25;
    this.mouseTargetY = ny * 0.65;
    this.isPointerHovering = true;
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  onPointerLeave(): void {
    this.isDragging = false;
    this.mouseTargetX = 0;
    this.mouseTargetY = 0;
    this.isPointerHovering = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.isDragging = true;
      this.dragStartX = event.touches[0].clientX;
      this.dragStartY = event.touches[0].clientY;
      this.isPointerHovering = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0 && this.isDragging) {
      const deltaX = event.touches[0].clientX - this.dragStartX;
      const deltaY = event.touches[0].clientY - this.dragStartY;
      this.manualRotY += deltaX * 0.012;
      this.manualRotX += deltaY * 0.01;
      this.dragStartX = event.touches[0].clientX;
      this.dragStartY = event.touches[0].clientY;
    }
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initThreeScene(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    this.isSoftwareGl = this.detectSoftwareWebGL();

    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance'
      });
    } catch {
      this.webglUnavailable.set(true);
      return;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    const dom = this.renderer.domElement;
    dom.addEventListener('webglcontextlost', this.contextLostHandler, false);
    dom.addEventListener('webglcontextrestored', this.contextRestoredHandler, false);
    container.appendChild(dom);

    // 1. Studio Reflections via RoomEnvironment
    this.scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmremGenerator.dispose();

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 0.16, 4.75);
    this.camera.lookAt(0, -0.04, 0);

    // 3. 3-Point Studio Lighting Rig
    const hemiFill = new THREE.HemisphereLight(0xe0f2fe, 0x94a3b8, 0.9);
    this.scene.add(hemiFill);

    const warmKeyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    warmKeyLight.position.set(3.2, 4.0, 3.5);
    this.scene.add(warmKeyLight);

    const cobaltRimLight = new THREE.DirectionalLight(0x2563eb, 2.2);
    cobaltRimLight.position.set(-3.5, 1.5, -2.5);
    this.scene.add(cobaltRimLight);

    // 4. Shared Materials & Shapes Construction
    this.initSharedMaterials();
    this.buildSoftCodeGlyph();

    this.buildHelixEngineShape();
    this.buildTesseractVaultShape();
    this.buildQuantumCoreShape();

    this.masterGroup.add(this.sharedGlyphGroup);
    this.masterGroup.add(this.helixGroup);
    this.masterGroup.add(this.tesseractGroup);
    this.masterGroup.add(this.quantumGroup);
    this.scene.add(this.masterGroup);

    this.buildContactShadow();
    this.applyActiveShapeVisibility(this.activeShape());

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 5. Resize Handling
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(w, h);
        }
      }
    });
    this.resizeObserver.observe(container);

    // 6. Start Animation Loop
    if (this.prefersReducedMotion) {
      this.updateScene(0, 0);
      this.renderer.render(this.scene, this.camera);
    } else {
      this.ngZone.runOutsideAngular(() => {
        this.startLoop();
      });
    }
  }

  private initSharedMaterials(): void {
    this.titaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      anisotropy: 0.75
    });

    this.cobaltMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e40af,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.25,
      metalness: 0.86,
      roughness: 0.16,
      clearcoat: 0.95
    });

    this.silverMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.2,
      clearcoat: 0.85
    });

    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.05,
      roughness: 0.08,
      transmission: this.isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.18 : 1.0,
      ior: 1.52,
      thickness: 0.9,
      attenuationColor: new THREE.Color(0xe0f2fe),
      attenuationDistance: 2.5,
      clearcoat: 1.0,
      depthWrite: false
    });

    this.packetMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x2563eb,
      emissiveIntensity: 0.55,
      metalness: 0.65,
      roughness: 0.15,
      clearcoat: 1.0
    });
  }

  /**
   * Central Extruded 3D Metallic SoftCode (</>) Emblem shared across all shapes
   */
  private buildSoftCodeGlyph(): void {
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.014,
      bevelSegments: 4
    };

    const addExtrudedPart = (shape: THREE.Shape, mat: THREE.Material) => {
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.translate(0, 0.06, -0.045);
      geo.computeVertexNormals();
      this.sharedGlyphGroup.add(new THREE.Mesh(geo, mat));
    };

    const leftParen = new THREE.Shape();
    leftParen.moveTo(-0.34, 0.25);
    leftParen.quadraticCurveTo(-0.49, 0.0, -0.34, -0.25);
    leftParen.lineTo(-0.29, -0.22);
    leftParen.quadraticCurveTo(-0.42, 0.0, -0.29, 0.22);
    leftParen.closePath();
    addExtrudedPart(leftParen, this.titaniumMat);

    const leftChev = new THREE.Shape();
    leftChev.moveTo(-0.11, 0.15);
    leftChev.lineTo(-0.26, 0.0);
    leftChev.lineTo(-0.11, -0.15);
    leftChev.lineTo(-0.07, -0.11);
    leftChev.lineTo(-0.18, 0.0);
    leftChev.lineTo(-0.07, 0.11);
    leftChev.closePath();
    addExtrudedPart(leftChev, this.titaniumMat);

    const slash = new THREE.Shape();
    slash.moveTo(0.03, 0.21);
    slash.lineTo(-0.08, -0.21);
    slash.lineTo(-0.02, -0.21);
    slash.lineTo(0.09, 0.21);
    slash.closePath();
    addExtrudedPart(slash, this.cobaltMat);

    const rightChev = new THREE.Shape();
    rightChev.moveTo(0.11, 0.15);
    rightChev.lineTo(0.26, 0.0);
    rightChev.lineTo(0.11, -0.15);
    rightChev.lineTo(0.07, -0.11);
    rightChev.lineTo(0.18, 0.0);
    rightChev.lineTo(0.07, 0.11);
    rightChev.closePath();
    addExtrudedPart(rightChev, this.titaniumMat);

    const rightParen = new THREE.Shape();
    rightParen.moveTo(0.34, 0.25);
    rightParen.quadraticCurveTo(0.49, 0.0, 0.34, -0.25);
    rightParen.lineTo(0.29, -0.22);
    rightParen.quadraticCurveTo(0.42, 0.0, 0.29, 0.22);
    rightParen.closePath();
    addExtrudedPart(rightParen, this.titaniumMat);

    // Compact "SCS CORE" nameplate fitted neatly underneath the central (</>) symbol
    this.buildInnerCoreTitleMesh();
  }

  private createInnerCoreTitleTexture(): THREE.CanvasTexture {
    const width = 1024;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.font = '800 116px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      const chars = ['S', 'C', 'S', ' ', 'C', 'O', 'R', 'E'];
      const tracking = 14;
      let totalWidth = 0;
      const charWidths = chars.map((ch) => ctx.measureText(ch).width);
      for (let i = 0; i < chars.length; i++) {
        totalWidth += charWidths[i] + (i < chars.length - 1 ? tracking : 0);
      }

      let cursorX = (width - totalWidth) / 2;
      const centerY = height / 2;

      const darkGrad = ctx.createLinearGradient(0, centerY - 58, 0, centerY + 58);
      darkGrad.addColorStop(0, '#334155');
      darkGrad.addColorStop(0.5, '#0f172a');
      darkGrad.addColorStop(1, '#1e293b');

      const cobaltGrad = ctx.createLinearGradient(0, centerY - 58, 0, centerY + 58);
      cobaltGrad.addColorStop(0, '#2563eb');
      cobaltGrad.addColorStop(0.55, '#1e40af');
      cobaltGrad.addColorStop(1, '#1e3a8a');

      for (let i = 0; i < chars.length; i++) {
        ctx.fillStyle = i < 3 ? darkGrad : cobaltGrad;
        ctx.fillText(chars[i], cursorX, centerY);
        cursorX += charWidths[i] + tracking;
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private buildInnerCoreTitleMesh(): void {
    const tex = this.createInnerCoreTitleTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.22,
      metalness: 0.65,
      side: THREE.FrontSide
    });

    const planeGeo = new THREE.PlaneGeometry(0.84, 0.21);

    const frontText = new THREE.Mesh(planeGeo, mat);
    frontText.position.set(0, -0.27, 0.01);
    this.sharedGlyphGroup.add(frontText);

    const backText = new THREE.Mesh(planeGeo, mat);
    backText.position.set(0, -0.27, -0.01);
    backText.rotation.y = Math.PI;
    this.sharedGlyphGroup.add(backText);
  }

  /**
   * SHAPE 1: Helix Engine — Architectural Double-Helix Commerce Ribbons,
   * Counter-Rotating Turbine Crown/Base & Equatorial Commerce Mesh
   */
  private buildHelixEngineShape(): void {
    // 1. Machined Crown & Base Turbine Assemblies
    const buildTurbineCap = (targetGroup: THREE.Group, yPos: number, radius: number) => {
      const torusGeo = new THREE.TorusGeometry(radius, 0.022, 16, 72);
      const ringMesh = new THREE.Mesh(torusGeo, this.titaniumMat);
      ringMesh.rotation.x = Math.PI / 2;
      targetGroup.add(ringMesh);

      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.012, 12, 64), this.cobaltMat);
      innerRing.rotation.x = Math.PI / 2;
      targetGroup.add(innerRing);

      // 8 Radial Turbine Blades
      const bladeGeo = new THREE.BoxGeometry(0.14, 0.018, 0.045);
      const bladeInst = new THREE.InstancedMesh(bladeGeo, this.silverMat, 8);
      for (let i = 0; i < 8; i++) {
        const theta = (i / 8) * Math.PI * 2;
        _vec3.set(Math.cos(theta) * radius * 0.86, 0, Math.sin(theta) * radius * 0.86);
        _quat.setFromAxisAngle(_up, -theta + 0.35);
        _scale.set(1, 1, 1);
        _mat4.compose(_vec3, _quat, _scale);
        bladeInst.setMatrixAt(i, _mat4);
      }
      bladeInst.instanceMatrix.needsUpdate = true;
      bladeInst.computeBoundingSphere();
      targetGroup.add(bladeInst);

      targetGroup.position.y = yPos;
    };

    buildTurbineCap(this.helixCrownGroup, 0.98, 0.62);
    buildTurbineCap(this.helixBaseGroup, -0.98, 0.68);
    this.helixGroup.add(this.helixCrownGroup, this.helixBaseGroup);

    // 2. Equatorial Precision Commerce Ring with 16 Calibration Nodes
    const eqTorus = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.015, 16, 108), this.silverMat);
    eqTorus.rotation.x = Math.PI / 2;
    this.helixEquatorialRing.add(eqTorus);

    const nodeGeo = new THREE.OctahedronGeometry(0.036, 0);
    const nodeInst = new THREE.InstancedMesh(nodeGeo, this.cobaltMat, 16);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      _vec3.set(Math.cos(a) * 1.22, 0, Math.sin(a) * 1.22);
      _quat.identity();
      _scale.set(1, 1, 1);
      _mat4.compose(_vec3, _quat, _scale);
      nodeInst.setMatrixAt(i, _mat4);
    }
    nodeInst.instanceMatrix.needsUpdate = true;
    nodeInst.computeBoundingSphere();
    this.helixEquatorialRing.add(nodeInst);
    this.helixEquatorialRing.rotation.z = 0.16;
    this.helixGroup.add(this.helixEquatorialRing);

    // 3. Double-Helix Closed Commerce Data Conduits (Vertical Spiral Loops)
    const createHelixLoop = (phaseOffset: number, colorHex: number) => {
      const pts: THREE.Vector3[] = [];
      const steps = 64;
      for (let i = 0; i < steps; i++) {
        const u = i / steps;
        const theta = u * Math.PI * 2;
        // Loop rises on outer spiral and descends on opposite spiral
        const y = Math.sin(theta) * 1.02;
        const radius = 0.72 + Math.cos(theta) * 0.34;
        const spin = theta * 2.0 + phaseOffset;
        pts.push(new THREE.Vector3(Math.cos(spin) * radius, y, Math.sin(spin) * radius));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      this.helixCurves.push(curve);

      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 128, 0.01, 8, true),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.34 })
      );
      this.helixGroup.add(tube);
    };

    createHelixLoop(0, 0x2563eb);
    createHelixLoop(Math.PI, 0x0284c7);

    // 4. 28 Flowing Commerce Packets along Both Helices
    const totalPackets = 28;
    this.helixPacketsMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.052, 0.036, 0.084),
      this.packetMat,
      totalPackets
    );
    this.helixPacketsMesh.frustumCulled = false;

    for (let i = 0; i < totalPackets; i++) {
      this.helixPackets.push({
        curveIndex: i % 2,
        offset: i / totalPackets,
        speed: 0.075 + (i % 2) * 0.015,
        baseScale: 0.85 + (i % 3) * 0.15
      });
    }
    this.helixGroup.add(this.helixPacketsMesh);

    // 5. Header-Matched (</>) Circular Logo Medallion that Tours & Hops Between Touching Lines
    this.buildHeaderLogoMedallion();
    this.helixGroup.add(this.helixRiderGroup);
    this.sampleHelixTrack(this.riderTrack, this.riderT, _riderPos, _riderTan);
    this.helixRiderGroup.position.copy(_riderPos);
  }

  private createHeaderLogoTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clean pure white circular surface matching header logo container
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Dark metallic (</>) emblem matching /logos/logo.png (no circular border lines)
      const grad = ctx.createLinearGradient(0, size * 0.32, 0, size * 0.68);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 136px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('(</>)', size / 2, size / 2 + 4);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private buildHeaderLogoMedallion(): void {
    const radius = 0.135;
    const thickness = 0.022;

    // 1. Clean white circular badge core (zero outer torus border rings)
    const discGeo = new THREE.CylinderGeometry(radius, radius, thickness, 36);
    discGeo.rotateX(Math.PI / 2);
    const whiteCeramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.02,
      roughness: 0.24,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    });
    this.helixRiderGroup.add(new THREE.Mesh(discGeo, whiteCeramicMat));

    // 2. Front & back crisp (</>) logo faces (readable from 360 degrees)
    const logoTex = this.createHeaderLogoTexture();
    const faceMat = new THREE.MeshStandardMaterial({
      map: logoTex,
      roughness: 0.28,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const faceGeo = new THREE.CircleGeometry(radius, 36);
    const frontFace = new THREE.Mesh(faceGeo, faceMat);
    frontFace.position.z = thickness / 2 + 0.001;
    this.helixRiderGroup.add(frontFace);

    const backFace = new THREE.Mesh(faceGeo, faceMat);
    backFace.position.z = -(thickness / 2 + 0.001);
    backFace.rotation.y = Math.PI;
    this.helixRiderGroup.add(backFace);
  }

  private sampleHelixTrack(trackId: number, t: number, outPos: THREE.Vector3, outTan: THREE.Vector3): void {
    const safeT = ((t % 1) + 1) % 1;
    if (trackId === 0 || trackId === 1) {
      const curve = this.helixCurves[trackId];
      if (curve) {
        curve.getPointAt(safeT, outPos);
        curve.getTangentAt(safeT, outTan);
      }
      return;
    }

    const angle = safeT * Math.PI * 2;
    if (trackId === 2) {
      // Tilted & rotating Equatorial Commerce Ring
      outPos.set(Math.cos(angle) * 1.22, 0, Math.sin(angle) * 1.22).applyMatrix4(this.helixEquatorialRing.matrix);
      outTan.set(-Math.sin(angle), 0, Math.cos(angle)).transformDirection(this.helixEquatorialRing.matrix).normalize();
      return;
    }

    if (trackId === 3) {
      // Top Turbine Crown Ring
      outPos.set(Math.cos(angle) * 0.62, 0.98, Math.sin(angle) * 0.62);
      outTan.set(-Math.sin(angle), 0, Math.cos(angle));
      return;
    }

    // Track 4: Bottom Turbine Base Ring
    outPos.set(Math.cos(angle) * 0.68, -0.98, Math.sin(angle) * 0.68);
    outTan.set(-Math.sin(angle), 0, Math.cos(angle));
  }

  private updateHelixRider(delta: number, elapsed: number): void {
    if (this.helixCurves.length < 2) return;

    // Speed normalized by track arc length so travel velocity feels consistent across all 5 lines
    const trackSpeeds = [0.145, 0.145, 0.175, 0.28, 0.26];
    const speedT = trackSpeeds[this.riderTrack] ?? 0.15;

    this.riderT = ((this.riderT + speedT * this.riderDir * delta) % 1 + 1) % 1;
    this.riderTimeOnTrack += delta;

    this.sampleHelixTrack(this.riderTrack, this.riderT, _riderPos, _riderTan);
    _riderTan.multiplyScalar(this.riderDir);

    // Detect intersecting/touching lines after riding current line briefly, prioritizing least-recently-visited tracks
    if (this.riderTransitionBlend >= 1 && this.riderTimeOnTrack >= 1.45) {
      let bestTrack = -1;
      let bestVisitOrder = Infinity;
      let bestDist = Infinity;
      let bestT = 0;

      const touchThreshold = 0.27;
      const samples = 32;

      for (let candTrack = 0; candTrack < 5; candTrack++) {
        if (candTrack === this.riderTrack) continue;

        let localMinDist = Infinity;
        let localBestT = 0;

        for (let s = 0; s < samples; s++) {
          const u = s / samples;
          this.sampleHelixTrack(candTrack, u, _candPos, _candTan);
          const d = _riderPos.distanceTo(_candPos);
          if (d < localMinDist) {
            localMinDist = d;
            localBestT = u;
          }
        }

        if (localMinDist < touchThreshold) {
          const visitRank = this.riderLastVisited[candTrack];
          if (visitRank < bestVisitOrder || (visitRank === bestVisitOrder && localMinDist < bestDist)) {
            bestVisitOrder = visitRank;
            bestDist = localMinDist;
            bestTrack = candTrack;
            bestT = localBestT;
          }
        }
      }

      if (bestTrack !== -1) {
        this.sampleHelixTrack(bestTrack, bestT, _bestPos, _bestTan);
        this.riderFromPos.copy(this.helixRiderGroup.position);
        this.riderFromQuat.copy(this.helixRiderGroup.quaternion);

        // Preserve forward flow momentum when attaching to the newly touched line
        this.riderDir = _riderTan.dot(_bestTan) >= 0 ? 1 : -1;
        this.riderTrack = bestTrack;
        this.riderT = bestT;
        this.riderTimeOnTrack = 0;
        this.riderTransitionBlend = 0;
        this.riderPulse = 1.0;
        this.riderLastVisited[bestTrack] = ++this.riderVisitCounter;

        this.sampleHelixTrack(this.riderTrack, this.riderT, _riderPos, _riderTan);
        _riderTan.multiplyScalar(this.riderDir);
      }
    }

    // Orient medallion radially outward so (</>) logo stays crisp & readable while banking with motion
    _vec3.set(_riderPos.x, 0, _riderPos.z);
    if (_vec3.lengthSq() < 0.001) {
      _vec3.set(0, 0, 1);
    } else {
      _vec3.normalize();
    }
    _lookMat.lookAt(_vec3, _origin, _up);
    _targetQuat.setFromRotationMatrix(_lookMat);

    // Subtle dynamic glide bank along travel direction
    _tiltQuat.setFromAxisAngle(_axisZ, Math.sin(elapsed * 2.2) * 0.08);
    _targetQuat.multiply(_tiltQuat);

    if (this.riderTransitionBlend < 1) {
      this.riderTransitionBlend = Math.min(1, this.riderTransitionBlend + delta / 0.28);
      const t = this.riderTransitionBlend;
      const smooth = t * t * (3 - 2 * t);
      this.helixRiderGroup.position.lerpVectors(this.riderFromPos, _riderPos, smooth);
      this.helixRiderGroup.quaternion.slerpQuaternions(this.riderFromQuat, _targetQuat, smooth);
    } else {
      this.helixRiderGroup.position.copy(_riderPos);
      this.helixRiderGroup.quaternion.slerp(_targetQuat, Math.min(1, (delta || 0.016) * 8));
    }

    // Magnetic attach pulse when latching onto a touching line
    if (this.riderPulse > 0) {
      this.riderPulse = Math.max(0, this.riderPulse - delta * 3.2);
      const s = 1.0 + Math.sin(this.riderPulse * Math.PI) * 0.16;
      this.helixRiderGroup.scale.set(s, s, s);
    } else {
      this.helixRiderGroup.scale.set(1, 1, 1);
    }
  }

  /**
   * SHAPE 2: Vault Cube (Tesseract) — Articulated Titanium Outer Hypercube Cage,
   * Rotating Inner Crystal Vault & 4 Orthogonal Trade Streams
   */
  private buildTesseractVaultShape(): void {
    // 1. Inner Rotating Optical Crystal Cube
    const innerGeo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
    this.tesseractInnerCube = new THREE.Mesh(innerGeo, this.glassMat);
    this.tesseractInnerCube.renderOrder = 2;
    this.tesseractGroup.add(this.tesseractInnerCube);

    this.tesseractInnerEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(innerGeo),
      new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.55 })
    );
    this.tesseractGroup.add(this.tesseractInnerEdges);

    // 2. Outer Articulated Titanium Hypercube Frame (12 Struts + 8 Corner Alloy Nodes)
    const half = 0.86;
    const cornerSigns = [
      [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]
    ];

    const cornerNodeGeo = new THREE.OctahedronGeometry(0.065, 0);
    for (const [sx, sy, sz] of cornerSigns) {
      const cornerMesh = new THREE.Mesh(cornerNodeGeo, this.cobaltMat);
      cornerMesh.position.set(sx * half, sy * half, sz * half);
      this.tesseractOuterFrame.add(cornerMesh);
    }

    const strutLen = half * 2;
    const strutGeo = new THREE.CylinderGeometry(0.014, 0.014, strutLen, 8);
    // 12 edges of cube
    for (const a of [-1, 1]) {
      for (const b of [-1, 1]) {
        // Y-aligned edges
        const yEdge = new THREE.Mesh(strutGeo, this.titaniumMat);
        yEdge.position.set(a * half, 0, b * half);
        this.tesseractOuterFrame.add(yEdge);

        // X-aligned edges
        const xEdge = new THREE.Mesh(strutGeo, this.titaniumMat);
        xEdge.rotation.z = Math.PI / 2;
        xEdge.position.set(0, a * half, b * half);
        this.tesseractOuterFrame.add(xEdge);

        // Z-aligned edges
        const zEdge = new THREE.Mesh(strutGeo, this.titaniumMat);
        zEdge.rotation.x = Math.PI / 2;
        zEdge.position.set(a * half, b * half, 0);
        this.tesseractOuterFrame.add(zEdge);
      }
    }
    this.tesseractOuterFrame.rotation.set(0.35, 0.45, 0.2);
    this.tesseractGroup.add(this.tesseractOuterFrame);

    // 3. 3 Orthogonal Commerce Bus Streams sweeping around the Vault Cube
    const busAxes = [
      new THREE.Euler(0.25, 0.1, 0),
      new THREE.Euler(Math.PI / 2 - 0.25, 0.3, 0.4),
      new THREE.Euler(0.4, -0.35, Math.PI / 2)
    ];

    for (let b = 0; b < busAxes.length; b++) {
      const pts: THREE.Vector3[] = [];
      const rad = 1.32;
      for (let i = 0; i < 32; i++) {
        const theta = (i / 32) * Math.PI * 2;
        // Rounded squircle path echoing the cube vault
        const x = Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), 0.72) * rad;
        const z = Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), 0.72) * rad;
        const y = Math.sin(theta * 2) * 0.18;
        const v = new THREE.Vector3(x, y, z).applyEuler(busAxes[b]);
        pts.push(v);
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      this.tesseractCurves.push(curve);

      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 96, 0.008, 8, true),
        new THREE.MeshBasicMaterial({ color: b === 1 ? 0x0284c7 : 0x2563eb, transparent: true, opacity: 0.32 })
      );
      this.tesseractGroup.add(tube);
    }

    const totalPackets = 24;
    this.tesseractPacketsMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.056, 0.04, 0.086),
      this.packetMat,
      totalPackets
    );
    this.tesseractPacketsMesh.frustumCulled = false;

    for (let i = 0; i < totalPackets; i++) {
      this.tesseractPackets.push({
        curveIndex: i % 3,
        offset: i / totalPackets,
        speed: 0.09 + (i % 3) * 0.018,
        baseScale: 0.85 + (i % 3) * 0.15
      });
    }
    this.tesseractGroup.add(this.tesseractPacketsMesh);
  }

  /**
   * SHAPE 3: Quantum Core — Original 3-Ring Gyroscope & Orbital Spline Streams
   */
  private buildQuantumCoreShape(): void {
    const icosaGeo = new THREE.IcosahedronGeometry(0.66, 0);
    this.qCrystalMesh = new THREE.Mesh(icosaGeo, this.glassMat);
    this.qCrystalMesh.renderOrder = 2;
    this.quantumGroup.add(this.qCrystalMesh);

    this.qCrystalEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(icosaGeo),
      new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.38 })
    );
    this.quantumGroup.add(this.qCrystalEdges);

    // Gyroscope Rings
    this.qRing1.add(new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.016, 16, 96), this.titaniumMat));
    const tickInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.055, 0.032), this.cobaltMat, 12);
    for (let i = 0; i < 12; i++) {
      const theta = (i / 12) * Math.PI * 2;
      _vec3.set(Math.cos(theta) * 0.92, Math.sin(theta) * 0.92, 0);
      _quat.setFromAxisAngle(_axisZ, theta);
      _scale.set(1, 1, 1);
      _mat4.compose(_vec3, _quat, _scale);
      tickInst.setMatrixAt(i, _mat4);
    }
    tickInst.instanceMatrix.needsUpdate = true;
    tickInst.computeBoundingSphere();
    this.qRing1.add(tickInst);
    this.qRing1.rotation.set(0.35, 0.2, 0);
    this.quantumGroup.add(this.qRing1);

    this.qRing2.add(new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.014, 16, 100), this.cobaltMat));
    const bracketGeo = new THREE.OctahedronGeometry(0.045, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const node = new THREE.Mesh(bracketGeo, this.titaniumMat);
      node.position.set(Math.cos(a) * 1.14, Math.sin(a) * 1.14, 0);
      this.qRing2.add(node);
    }
    this.qRing2.rotation.set(1.05, -0.4, 0.35);
    this.quantumGroup.add(this.qRing2);

    this.qRing3.add(new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.012, 16, 112), this.silverMat));
    const dashedPts = new THREE.EllipseCurve(0, 0, 1.42, 1.42, 0, Math.PI * 2, false, 0).getPoints(72);
    const dashedRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(dashedPts),
      new THREE.LineDashedMaterial({ color: 0x0284c7, dashSize: 0.14, gapSize: 0.08, transparent: true, opacity: 0.45 })
    );
    dashedRing.computeLineDistances();
    this.qRing3.add(dashedRing);
    this.qRing3.rotation.set(-0.78, 0.52, -0.2);
    this.quantumGroup.add(this.qRing3);

    // Orbital Commerce Streams
    const streamConfigs = [
      { rx: 1.32, ry: 0.56, rz: 1.08, tiltX: 0.45, tiltZ: 0.3, color: 0x2563eb },
      { rx: 1.24, ry: 0.68, rz: 1.28, tiltX: -0.62, tiltZ: 0.55, color: 0x0284c7 },
      { rx: 1.42, ry: 0.48, rz: 1.16, tiltX: 0.25, tiltZ: -0.72, color: 0x1d4ed8 }
    ];

    for (const cfg of streamConfigs) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 36; i++) {
        const theta = (i / 36) * Math.PI * 2;
        const v = new THREE.Vector3(
          Math.cos(theta) * cfg.rx,
          Math.sin(theta * 2) * cfg.ry * 0.55,
          Math.sin(theta) * cfg.rz
        ).applyEuler(new THREE.Euler(cfg.tiltX, 0, cfg.tiltZ));
        pts.push(v);
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      this.qCurves.push(curve);

      this.quantumGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 96, 0.0085, 8, true),
          new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.36 })
        )
      );
    }

    const totalPackets = 24;
    this.qPacketsMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.055, 0.036, 0.085),
      this.packetMat,
      totalPackets
    );
    this.qPacketsMesh.frustumCulled = false;

    for (let i = 0; i < totalPackets; i++) {
      this.qPackets.push({
        curveIndex: i % 3,
        offset: i / totalPackets,
        speed: 0.085 + (i % 3) * 0.02,
        baseScale: 0.85 + (i % 3) * 0.15
      });
    }
    this.quantumGroup.add(this.qPacketsMesh);

    // 6 Multi-Tenant Satellite Nodes + Dynamic Filaments
    const satCount = 6;
    this.qFilamentPositions = new Float32Array(satCount * 2 * 3);
    const satGeo = new THREE.OctahedronGeometry(0.055, 0);
    for (let i = 0; i < satCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / satCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const mesh = new THREE.Mesh(satGeo, this.titaniumMat);
      mesh.position.set(
        1.48 * Math.sin(phi) * Math.cos(theta),
        1.48 * Math.cos(phi) * 0.72,
        1.48 * Math.sin(phi) * Math.sin(theta)
      );
      this.qSatelliteMeshes.push(mesh);
      this.qSatellitesGroup.add(mesh);
    }
    this.quantumGroup.add(this.qSatellitesGroup);

    const filGeo = new THREE.BufferGeometry();
    filGeo.setAttribute('position', new THREE.BufferAttribute(this.qFilamentPositions, 3));
    this.qFilamentLines = new THREE.LineSegments(
      filGeo,
      new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.28 })
    );
    this.quantumGroup.add(this.qFilamentLines);
  }

  private buildContactShadow(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.14)');
      grad.addColorStop(0.45, 'rgba(30, 41, 59, 0.06)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    const shadowTex = new THREE.CanvasTexture(canvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.58;
    this.scene.add(shadowMesh);
  }

  private applyActiveShapeVisibility(shape: CoreShape): void {
    this.helixGroup.visible = shape === 'helix';
    this.tesseractGroup.visible = shape === 'tesseract';
    this.quantumGroup.visible = shape === 'quantum';
  }

  private startLoop(): void {
    this.stopLoop();
    this.clock.start();
    const tick = () => {
      if (this.isDestroyed) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      this.updateScene(delta, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private stopLoop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
      this.frameId = 0;
    }
  }

  private afterDraw(cb: () => void): void {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } catch {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private updatePacketsAlongCurves(
    instMesh: THREE.InstancedMesh,
    packets: DataPacket[],
    curves: THREE.CatmullRomCurve3[],
    elapsed: number
  ): void {
    if (!instMesh || curves.length === 0) return;
    for (let i = 0; i < packets.length; i++) {
      const pkt = packets[i];
      const curve = curves[pkt.curveIndex];
      const t = (pkt.offset + elapsed * pkt.speed) % 1;

      curve.getPointAt(t, _vec3);
      curve.getTangentAt(t, _tangent);
      _quat.setFromUnitVectors(_up.set(0, 0, 1), _tangent);

      const s = pkt.baseScale * (1.0 + Math.sin(elapsed * 4.0 + i) * 0.12);
      _scale.set(s, s, s);
      _mat4.compose(_vec3, _quat, _scale);
      instMesh.setMatrixAt(i, _mat4);
    }
    _up.set(0, 1, 0);
    instMesh.instanceMatrix.needsUpdate = true;
  }

  private updateScene(delta: number, elapsed: number): void {
    // 1. Smooth Exponential Damping for 360° Cursor Tracking
    const dampLambda = this.isPointerHovering ? 5.0 : 2.5;
    this.mouseCurrentX = THREE.MathUtils.damp(this.mouseCurrentX, this.mouseTargetX, dampLambda, delta || 0.016);
    this.mouseCurrentY = THREE.MathUtils.damp(this.mouseCurrentY, this.mouseTargetY, dampLambda, delta || 0.016);

    // 2. Continuous Autonomous Cruise + Drag + Cursor Parallax
    if (!this.isDragging) {
      this.autoCruiseY += delta * 0.24;
    }

    this.masterGroup.position.y = Math.sin(elapsed * 1.4) * 0.045;
    this.masterGroup.rotation.y = this.autoCruiseY + this.manualRotY + this.mouseCurrentX;
    this.masterGroup.rotation.x = this.manualRotX - this.mouseCurrentY * 0.75;

    // Central SoftCode (</>) glyph subtle counter-sway
    this.sharedGlyphGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.22;

    const current = this.activeShape();

    // 3. Animate Only Active Shape Sub-Assemblies
    if (current === 'helix') {
      this.helixCrownGroup.rotation.y += delta * 0.45;
      this.helixBaseGroup.rotation.y -= delta * 0.45;
      this.helixEquatorialRing.rotation.y += delta * 0.28;
      this.helixEquatorialRing.updateMatrix();
      this.updatePacketsAlongCurves(this.helixPacketsMesh, this.helixPackets, this.helixCurves, elapsed);
      this.updateHelixRider(delta, elapsed);
    } else if (current === 'tesseract') {
      this.tesseractOuterFrame.rotation.y += delta * 0.22;
      this.tesseractOuterFrame.rotation.x += delta * 0.14;
      const breathe = 1.0 + Math.sin(elapsed * 1.6) * 0.045;
      this.tesseractOuterFrame.scale.set(breathe, breathe, breathe);

      this.tesseractInnerCube.rotation.y -= delta * 0.3;
      this.tesseractInnerCube.rotation.z += delta * 0.18;
      this.tesseractInnerEdges.rotation.copy(this.tesseractInnerCube.rotation);
      this.updatePacketsAlongCurves(this.tesseractPacketsMesh, this.tesseractPackets, this.tesseractCurves, elapsed);
    } else if (current === 'quantum') {
      this.qCrystalMesh.rotation.y -= delta * 0.18;
      this.qCrystalMesh.rotation.x += delta * 0.1;
      this.qCrystalEdges.rotation.copy(this.qCrystalMesh.rotation);

      this.qRing1.rotation.z += delta * 0.45;
      this.qRing2.rotation.z -= delta * 0.36;
      this.qRing2.rotation.y += delta * 0.18;
      this.qRing3.rotation.z += delta * 0.26;
      this.qSatellitesGroup.rotation.y += delta * 0.22;

      this.updatePacketsAlongCurves(this.qPacketsMesh, this.qPackets, this.qCurves, elapsed);

      if (this.qFilamentLines && this.qSatelliteMeshes.length > 0) {
        const groupQuat = this.qSatellitesGroup.quaternion;
        for (let i = 0; i < this.qSatelliteMeshes.length; i++) {
          _vec3.copy(this.qSatelliteMeshes[i].position).applyQuaternion(groupQuat);
          const base = i * 6;
          this.qFilamentPositions[base] = 0;
          this.qFilamentPositions[base + 1] = 0;
          this.qFilamentPositions[base + 2] = 0;
          this.qFilamentPositions[base + 3] = _vec3.x;
          this.qFilamentPositions[base + 4] = _vec3.y;
          this.qFilamentPositions[base + 5] = _vec3.z;
        }
        this.qFilamentLines.geometry.attributes['position'].needsUpdate = true;
      }
    }
  }

  private disposeHierarchy(obj: THREE.Object3D): void {
    if (!obj) return;
    obj.traverse((child) => {
      if ((child as any).geometry) {
        (child as any).geometry.dispose();
      }
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((mat: any) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        } else {
          if ((child as any).material.map) {
            (child as any).material.map.dispose();
          }
          (child as any).material.dispose();
        }
      }
    });
  }
}
