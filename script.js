import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader,
} from "./shader.js"    


document.addEventListener("DOMContentLoaded", () => {
    const scene = new THREE.Scene()
    const simScene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const mouse = new THREE.Vector2()
    let frame = 0
    const width = window.innerWidth * window.devicePixelRatio
    const height = window.innerHeight * window.devicePixelRatio

    const options ={
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
    }

    let rtA = new THREE.WebGLRenderTarget(width, height, options)
    let rtB = new THREE.WebGLRenderTarget(width, height, options)

    const simMaterial = new THREE.ShaderMaterial({
        uniforms:{
            textureA: { value: null },
            mouse: {value : mouse},
            resolution : { value : new THREE.Vector2(width, height) },
            time: {value :0},
            frame: {value:0}
        },
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
    })

    const createTextTexture = () => {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        
        // Clear and set background
        ctx.fillStyle = "#fb7427"
        ctx.fillRect(0, 0, width, height)
        
        // Calculate smaller font size based on screen width
        const fontSize = Math.min(width / 10, height / 5) 
        ctx.fillStyle = "#fef4b8"
        ctx.font = `900 ${fontSize}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        
        // Measure text width to ensure perfect centering
        const text = "Blue Lock"
        const metrics = ctx.measureText(text)
        const textWidth = metrics.width
        
        // Calculate exact center position
        const centerX = width / 2
        const centerY = height / 2
        
        // Add stroke with adjusted width for smaller text
        ctx.strokeStyle = "#fef4b8"
        ctx.lineWidth = fontSize / 35 
        ctx.strokeText(text, centerX, centerY)
        ctx.fillText(text, centerX, centerY)
        
        return new THREE.CanvasTexture(canvas)
    }

    const bgTexture = createTextTexture()
    bgTexture.minFilter = THREE.LinearFilter
    bgTexture.magFilter = THREE.LinearFilter

    const renderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            textureB: { value: bgTexture },
        },
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
        transparent: true,
    })

    const plane = new THREE.PlaneGeometry(2,2)
    const simQuad = new THREE.Mesh(plane, simMaterial)
    const renderQuad = new THREE.Mesh(plane, renderMaterial)

    simScene.add(simQuad)
    scene.add(renderQuad)

    window.addEventListener("resize", () => {
        const newWidth = window.innerWidth * window.devicePixelRatio
        const newHeight = window.innerHeight * window.devicePixelRatio

        renderer.setSize(window.innerWidth, window.innerHeight)
        rtA.setSize(newWidth, newHeight)
        rtB.setSize(newWidth, newHeight)
        simMaterial.uniforms.resolution.value.set(newWidth, newHeight)

        bgTexture.dispose()
        const newBgTexture = createTextTexture()
        newBgTexture.minFilter = THREE.LinearFilter
        newBgTexture.magFilter = THREE.LinearFilter
        renderMaterial.uniforms.textureB.value = newBgTexture
    })

    renderer.domElement.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX * window.devicePixelRatio
        mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio
    })

    renderer.domElement.addEventListener("mouseleave", () => {
        mouse.set(0,0)
    })

    const animate = () =>{
        simMaterial.uniforms.frame.value = frame++
        simMaterial.uniforms.time.value = performance.now() /1000;

        simMaterial.uniforms.textureA.value = rtA.texture
        renderer.setRenderTarget(rtB)
        renderer.render(simScene, camera)

        renderMaterial.uniforms.textureA.value = rtA.texture
        renderMaterial.uniforms.textureB.value = bgTexture
        renderer.setRenderTarget(null)
        renderer.render(scene, camera)

        const temp = rtA
        rtA = rtB
        rtB = temp

        requestAnimationFrame(animate)
    }
    animate()
})