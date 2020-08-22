import os
import streamlit.components.v1 as components
from PIL import Image
import numpy as np

_RELEASE = True

if not _RELEASE:
    _component_func = components.declare_component(
        "st_cropper",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("st_cropper", path=build_dir)


def _resize_img(img: Image, max_height: int=700, max_width: int=700) -> Image:
    # Resize the image to be a max of 700x700 by default, or whatever the user 
    # provides. If streamlit has an attribute to expose the default width of a widget,
    # we should use that instead.
    if img.height > max_height:
        ratio = max_height / img.height
        img = img.resize((int(img.width * ratio), int(img.height * ratio)))
    if img.width > max_width:     
        ratio = max_width / img.width
        img = img.resize((int(img.width * ratio), int(img.height * ratio)))
    return img

def _recommended_box(img: Image) -> dict:
    # Find a recommended box for the image (could be replaced with image detection)
    box = (img.width * 0.2, img.height * 0.2, img.width * 0.8, img.height * 0.8)
    box = tuple([int(i) for i in box])
    left = box[0]
    top = box[1]
    width = box[2] - left
    height = box[3] - top
    return {'left' : left, 'top' : top, 'width' : width, 'height' : height}


def st_cropper(img: Image, realtime_update: bool=True, box_color: str='blue', key=None) -> Image:
    """Create a new instance of "st_cropper".

    Parameters
    ----------
    img_file: PIL.Image
        The image to be croppepd
    realtime_update: bool
        A boolean value to determine whether the cropper will update in realtime.
        If set to False, a double click is required to crop the image.
    box_color: string
        The color of the cropper's bounding box. Defaults to blue, can accept 
        other string colors recognized by fabric.js or hex colors in a format like
        '#ff003c'
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    PIL.Image
    The cropped image in PIL.Image format
    """

    # Load the image and resize to be no wider than the streamlit widget size 
    img = _resize_img(img)

    # Find a default box 
    box = _recommended_box(img)
    rectLeft = box['left']
    rectTop = box['top']
    rectWidth = box['width']
    rectHeight = box['height']

    # Get arguments to send to frontend
    canvasWidth = img.width
    canvasHeight = img.height

    # Translates image to a list for passing to Javascript
    imageData = np.array(img.convert("RGBA")).flatten().tolist()

    # Call through to our private component function. Arguments we pass here
    # will be sent to the frontend, where they'll be available in an "args"
    # dictionary.
    #
    # Defaults to a box whose vertices are at 20% and 80% of height and width. 
    # The _recommended_box function could be replaced with some kind of image
    # detection algorith if it suits your needs.
    component_value = _component_func(canvasWidth=canvasWidth, canvasHeight=canvasHeight, realtimeUpdate=realtime_update,
                                      rectHeight=rectHeight, rectWidth=rectWidth, rectLeft=rectLeft, rectTop=rectTop,
                                      boxColor=box_color, imageData=imageData, key=key)

    # Return a cropped image using the box from the frontend
    if component_value:
        rect = component_value['coords']
    else:
        rect = box
    cropped_img = img.crop((rect['left'], rect['top'], rect['width'] + rect['left'], rect['height'] + rect['top']))
    return cropped_img


# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run my_component/__init__.py`
if not _RELEASE:
    import streamlit as st
    st.set_option('deprecation.showfileUploaderEncoding', False)
    st.header("Cropper Testing")
    img_file = st.sidebar.file_uploader(label='Upload a file', )
    if img_file:
        img = Image.open(img_file)
        
        # Get a cropped image from the frontend
        cropped_img = st_cropper(img)
        
        # Manipulate cropped image at will
        st.write("Preview")
        _ = cropped_img.thumbnail((150,150))
        st.image(cropped_img)

    
