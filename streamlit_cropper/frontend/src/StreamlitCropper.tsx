import React, {useEffect, useRef, useState} from 'react';
import {ComponentProps, Streamlit, withStreamlitConnection} from "./streamlit";
import { Canvas, Rect, Image as FabricImage } from 'fabric';

interface PythonArgs {
    canvasWidth: number
    canvasHeight: number
    rectTop: number
    rectLeft: number
    rectWidth: number
    rectHeight: number
    realtimeUpdate: boolean
    boxColor: string
    strokeWidth: number
    imageData: string // base64 string
    lockAspect: boolean
}



const StreamlitCropper = (props: ComponentProps) => {
    const [canvas, setCanvas] = useState<Canvas | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rectRef = useRef<Rect | null>(null);
    const {canvasWidth, canvasHeight, imageData}: PythonArgs = props.args;
    // imageData is now a base64 string (data URL)
    const dataUri = imageData || "";

    /**
     * Initialize canvas on mount and add a rectangle
     */
    useEffect(() => {
        // Only initialize Fabric once
        if (!canvasRef.current || canvas) return;
        const {rectTop, rectLeft, rectWidth, rectHeight, boxColor, strokeWidth, lockAspect}: PythonArgs = props.args;
        console.log(lockAspect, "lockAspect")
        const fabricCanvas = new Canvas(canvasRef.current, {
            enableRetinaScaling: false,
            uniformScaling: lockAspect
        });

        if (dataUri) {
            FabricImage.fromURL(dataUri).then((img: FabricImage) => {
                fabricCanvas.backgroundImage = img;
                fabricCanvas.requestRenderAll();
            });
        }

        const rect = new Rect({
            left: rectLeft,
            top: rectTop,
            fill: '',
            width: rectWidth,
            height: rectHeight,
            objectCaching: true,
            stroke: boxColor,
            strokeWidth: strokeWidth,
            // lockScalingFlip: true,
        });
        rect.set({
            hasRotatingControl: false,
        });        // Hide the rotation control and show/hide edge controls based on lockAspect
        rect.setControlsVisibility && rect.setControlsVisibility({
            mt: !lockAspect, // middle top
            mb: !lockAspect, // middle bottom
            ml: !lockAspect, // middle left
            mr: !lockAspect, // middle right
            mtr: false,      // rotation control
            tl: true,        // always show corners for free resize
            tr: true,
            bl: true,
            br: true
        });
        fabricCanvas.add(rect);
        rectRef.current = rect;

        setCanvas(fabricCanvas);
        Streamlit.setFrameHeight();

        return () => {
            fabricCanvas.dispose();
        };
        // eslint-disable-next-line
    }, []);

    // Update rectangle properties when props.args change
    useEffect(() => {
        if (!canvas || !rectRef.current) return;
        const {rectTop, rectLeft, rectWidth, rectHeight, boxColor, strokeWidth, lockAspect}: PythonArgs = props.args;
        const rect = rectRef.current;
        rect.set({
            left: rectLeft,
            top: rectTop,
            width: rectWidth,
            height: rectHeight,
            stroke: boxColor,
            strokeWidth: strokeWidth,
            hasRotatingControl: false,
        });
        // Hide the rotation control and show/hide edge controls based on lockAspect
        rect.setControlsVisibility && rect.setControlsVisibility({
            mt: !lockAspect,
            mb: !lockAspect,
            ml: !lockAspect,
            mr: !lockAspect,
            mtr: false,
            tl: true,
            tr: true,
            bl: true,
            br: true
        });
        rect.setCoords();
        canvas.requestRenderAll();
    }, [props.args, canvas]);


    /**
     * On update (either realtime or doubleclick), send the coordinates of the rectangle
     * back to streamlit.
     */
    useEffect(() => {
        const {realtimeUpdate}: PythonArgs = props.args
        if (!canvas) {
            return;
        }
        const handleEvent = () => {
            canvas.renderAll()
            const coords = canvas.getObjects()[0].getBoundingRect()
            Streamlit.setComponentValue({coords:coords})
        }
        
        if (realtimeUpdate) {
        canvas.on("object:modified", handleEvent)
        return () => {
            canvas.off("object:modified");
        }
        }
        else {
        canvas.on("mouse:dblclick", handleEvent)
        return () => {
            canvas.off("mouse:dblclick");
        }
        }
    })

    return (
        <>
            <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}/>
        </>
    )
};

export default withStreamlitConnection(StreamlitCropper);
