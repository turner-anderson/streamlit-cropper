import React, {useEffect, useState} from 'react';
import {ComponentProps, Streamlit, withStreamlitConnection} from "./streamlit";
import {fabric} from 'fabric';

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
    const [canvas, setCanvas] = useState(new fabric.Canvas(""))
    const {canvasWidth, canvasHeight, imageData}: PythonArgs = props.args
    // imageData is now a base64 string (data URL)
    const dataUri = imageData || ""
    
    /**
     * Initialize canvas on mount and add a rectangle
     */
    useEffect  (() => {
        const {rectTop, rectLeft, rectWidth, rectHeight, boxColor, strokeWidth, lockAspect}: PythonArgs = props.args
        const canvas = new fabric.Canvas('c', {
            enableRetinaScaling: false,
            backgroundImage: dataUri,
            uniScaleTransform: lockAspect
        })

        var rect = new fabric.Rect({
            left: rectLeft,
            top: rectTop,
            fill: '',
            width: rectWidth,
            height: rectHeight,
            objectCaching: true,
            stroke: boxColor,
            strokeWidth: strokeWidth,
            hasRotatingPoint: false

          });
        canvas.add(rect)

        setCanvas(canvas)
        Streamlit.setFrameHeight()
        // eslint-disable-next-line
    }, [canvasHeight, canvasWidth]);


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
            <canvas id="c" width={canvasWidth} height={canvasHeight}/>
        </>
    )
};

export default withStreamlitConnection(StreamlitCropper);
