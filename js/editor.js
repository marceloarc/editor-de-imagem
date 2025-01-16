let isMousePressed = false;
const alignments = ["left", "center", "right", "justify"];
let currentIndex = 0;
const undoStack = [];
const redoStack = [];
const icons = ["fa-align-left", "fa-align-center", "fa-align-right", "fa-align-justify"];
const alignmentIcons = {
    left: "fa-align-left",
    center: "fa-align-center",
    right: "fa-align-right",
    justify: "fa-align-justify"
};
const detectElement = document.querySelector(".wrapper");
const zoomElement = document.querySelector(".zoom");
let zoom = 1;
var color;
var size;
var lineColor;
var lineSize;
var copiedShape;
const ZOOM_SPEED = 0.1;
let title = "Sem Título";
var mode = 'brush';
$(document).on('mousedown touchstart', function () {
    isMousePressed = true;
});

function saveState() {
    const MAX_STATES = 50;
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    const state = userLayers.map(layer => layer.toJSON());

    undoStack.push(state);

    if (undoStack.length > MAX_STATES) {
        undoStack.shift();
    }

    redoStack.length = 0;

    updateundoRedoBtn();
}

function updateundoRedoBtn() {
    if (undoStack.length === 0) {
        $("#undo").attr('disabled', true);
        $("#undo").addClass('disabled');
    } else {
        $("#undo").attr('disabled', false);
        $("#undo").removeClass('disabled');
    }
    if (redoStack.length === 0) {
        $("#redo").attr('disabled', true);
        $("#redo").addClass('disabled');
    } else {
        $("#redo").attr('disabled', false);
        $("#redo").removeClass('disabled');
    }
}

function undo() {
    if (undoStack.length === 0) return;
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    const currentState = userLayers.map(layer => layer.toJSON());

    redoStack.push(currentState);

    restoreState(undoStack.pop());
    updateundoRedoBtn();
}
function restoreImage(image, layer) {
    const imageSrc = image.getAttr("imageSrc");
    const restoredImageObj = new Image();

    restoredImageObj.onload = function () {
        image.image(restoredImageObj);
        image.cache();
        image.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
        layer.draw();
    };
    restoredImageObj.src = imageSrc;
}

function saveToCustomFormat() {
    // Obtenha o JSON do stage
    saveState()

    const stageResolution = {
        width: stageWidth,
        height: stageHeight,
        title: title
    };

    // Crie um objeto com dados adicionais
    const exportData = {
        resolution: stageResolution,
        layers: undoStack.pop() // O estado das camadas salvas
    };
    // Crie um Blob com o JSON
    const jsonBlob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.gproj`;
    a.click();

    URL.revokeObjectURL(url); // Limpa o objeto URL após o uso
}


$("#save").click(function(){
    saveToCustomFormat();  
})
$("#import").click(function(){
    $("#input-import").click();
})

$('#input-import').on('change', function (e) {
    const file = e.target.files[0]; // Obtém o arquivo
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const fileContent = JSON.parse(e.target.result);
    
                // Extraia as informações
                const { resolution, layers } = fileContent;
    
                // Redimensione o stage, se necessário
                if (resolution) {
                    setNewCanvasSize(resolution.width, resolution.height);
                    title = resolution.title;
                }
    
                    
                restoreState(layers);
                redoStack.length = 0;
                undoStack.length = 0;
                updateundoRedoBtn();
            } catch (err) {
                console.error("Erro ao carregar o arquivo:", err.message);
            }
        };
        reader.readAsText(file);
    }
});
function restoreState(stack) {
    if (stack.length === 0) return;


    const state = stack;
    const currentShape = transformer.nodes()[0];
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    userLayers.forEach((layer) => {
        layer.destroy();
    });
    state.forEach(layerJSON => {
        const layer = Konva.Node.create(layerJSON);

        const objects = layer.getChildren();

        objects.forEach(obj => {
            if (obj instanceof Konva.Text) {
                generateTextEvents(obj, layer);
            } else if (obj instanceof Konva.Circle) {
                if (obj.id() == "DrawCursorRadius") {
                    if (!drawMode) obj.destroy();
                    var pointerPosition = stage.getPointerPosition();

                    if (!pointerPosition) return;

                    var scale = stage.scale();
                    var stagePosition = stage.position();

                    var adjustedPosition = {
                        x: (pointerPosition.x - stagePosition.x) / scale.x,
                        y: (pointerPosition.y - stagePosition.y) / scale.y
                    };

                    obj.x(adjustedPosition.x)
                    obj.y(adjustedPosition.y)
                    return;
                }
                generateLineEvents
                generateShapeEvents(obj, layer);
            } else if (obj instanceof Konva.Image) {
                restoreImage(obj, layer)
                generateImageEvents(obj, layer);
            } else if (obj instanceof Konva.Rect) {
                if (obj.name() == "background") {
                    generateBackgroundEvents(obj, layer);
                } else {
                    generateShapeEvents(obj, layer);
                }
            } else if (obj instanceof Konva.RegularPolygon) {
                generateShapeEvents(obj, layer);
            } else if (obj instanceof Konva.Line) {
                generateLineEvents(obj,layer);
            }
            else {
            }
            if (currentShape) {

                if (obj.id() == currentShape.id()) {
                    stage.fire('click', { target: obj });
                    obj.fire("click");
                } else {

                    stage.fire('click');
                }
            }
        });
        $("#currentLayer").val(layer.id());
        stage.add(layer);
    });

    updateLayerButtons();
    stage.draw();
}

function redo() {
    if (redoStack.length === 0) return;

    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    const currentState = userLayers.map(layer => layer.toJSON());
    undoStack.push(currentState);

    restoreState(redoStack.pop());
    updateundoRedoBtn();
}

$("#export-prompt").click(function(){
    var stagePosition = $(this).offset();
    var widget = document.getElementById('widget-export');
    $("#widget-export").fadeIn(100);
    const adjustedTop = (stagePosition.top);
    const adjustedLeft = (stagePosition.left);
    widget.style.position = 'absolute';
    widget.style.top = adjustedTop+10+"px";
    widget.style.right= "10px";
})

$("#new-prompt").click(function(){
    var stagePosition = $(this).offset();
    var widget = document.getElementById('widget-new');
    $("#widget-new").fadeIn(100);
    const adjustedTop = (stagePosition.top);
    const adjustedLeft = (stagePosition.left);
    widget.style.position = 'absolute';
    widget.style.top = adjustedTop+"px";
    widget.style.left = adjustedLeft+$(this).outerWidth()+'px';
})

$("#undo").click(function () {
    undo();
})
$("#redo").click(function () {
    redo();
})
$(document).on('mouseup touchend', function () {
    isMousePressed = false;
});


document.addEventListener("keydown", (e) => {
    if ((e.key === "Delete")) {
        if (transformer.nodes().length > 0) {
            saveState();
            var layer = stage.findOne("#" + $("#currentLayer").val());
            var shape = transformer.nodes()[0];
            deleteShape(shape, layer);
        }
    }
    if ((e.ctrlKey && e.key === "c")) {
        if (transformer.nodes().length > 0) {
            copiedShape = transformer.nodes()[0];
        }
    }
    if ((e.ctrlKey && e.key === "v")) {
        if (copiedShape) {
            saveState();
            var layer = stage.findOne("#" + $("#currentLayer").val());
            copyShape(copiedShape, layer);
        }
    }
    if (e.ctrlKey && e.key === "z") {
        undo();
    } else if (e.ctrlKey && e.key === "y") {
        redo();
    }
});

$(document).ready(function () {
    let isDragging = false;
    let isDragging2 = false;
    let startX, startY, scrollLeft, scrollTop;

    const $container = $('.editor-panel');

    $container.on('mousedown', function (e) {
        isDragging = true;
        startX = e.pageX - $container.offset().left;
        startY = e.pageY - $container.offset().top;
        scrollLeft = $container.scrollLeft();
        scrollTop = $container.scrollTop();
        $container.css('cursor', 'grabbing');
    });
    const $container2 = $('.slidecontainer2');

    $container2.on('mousedown', function (e) {
        isDragging2 = true;
        startX = e.pageX - $container.offset().left;
        startY = e.pageY - $container.offset().top;
        scrollLeft = $container.scrollLeft();
        scrollTop = $container.scrollTop();
        $container.css('cursor', 'grabbing');
    });

    $(document).on('mousemove', function (e) {
        if (isDragging) {
            e.preventDefault();
            const x = e.pageX - $container.offset().left;
            const y = e.pageY - $container.offset().top;

            const walkX = (x - startX) * -1;
            const walkY = (y - startY) * -1;

            $container.scrollLeft(scrollLeft + walkX);
            $container.scrollTop(scrollTop + walkY);
        }
        if (isDragging2) {
            e.preventDefault();
            const x = e.pageX - $container.offset().left;
            const y = e.pageY - $container.offset().top;

            const walkX = (x - startX) * -1;
            const walkY = (y - startY) * -1;

            $container2.scrollLeft(scrollLeft + walkX);
            $container2.scrollTop(scrollTop + walkY);
        }
    });

    $(document).on('mouseup', function () {
        isDragging = false;
        isDragging2 = false;
        $container.css('cursor', 'grab');
        $container2.css('cursor', 'grab');
    });


    $(".close").on('click', function (e) {
        $(this).closest(".widget").fadeOut(100);
        $(this).closest(".widget-fixed").fadeOut(100);
        var parent = $(this).parent();
        if (parent.attr('id') == "widget-draw") {
            $("#draw").click();
        }
        if (parent.attr('id') == "widget-draw-line") {
            drawingLineMode = false;
            $("#draw-line").css("background",'transparent');
        }
        if (parent.hasClass('layers-header')) {
            if($("#open-layers-btn").hasClass('active')){
                $("#open-layers-btn").removeClass('active')
            }
        }
    });
    $(document).tooltip({
        position: {
            my: "center bottom-10",
            at: "center top",
            using: function (position, feedback) {
                $(this).css(position);
                $("<div>")
                    .addClass("arrow")
                    .addClass(feedback.vertical)
                    .addClass(feedback.horizontal)
                    .appendTo(this);
            }
        },
        show: {
            delay: 500,
            effect: "fade"
        }
    });

    $(".minimize").on('click', function (e) {
        var width = $(this).closest(".widget-header").width();
        $(this).closest(".widget-sm").children("#layers-body").toggle();
        $(this).closest(".widget-header").width(width);
        const icon = $(this).find('i');
        icon.toggleClass('mdi-window-minimize mdi-window-maximize');
    });

    var movedLayerId = null;
    $('#layers').sortable({
        items: '.layer',
        placeholder: 'ui-sortable-placeholder',
        forcePlaceholderSize: true,
        axis: 'x',
        start: function (event, ui) {

            // originalIndexBefore = ui.item.index();
            movedLayerId = ui.item.attr('layer-id');
            const layersOrder = $('#layers .layer');
            layersOrder.each(function (index, value) {
                $(value).removeClass("active");
            });
            ui.item.addClass("active");
            $("#currentLayer").val(movedLayerId);
            setActiveLayer(movedLayerId)
            // movedLayer = stage.findOne(`#${movedLayerId}`);
        },

        update: function (event, ui) {
            const layersOrder = $('#layers .layer');
            layersOrder.each(function (index) {
                const layerId = $(this).attr('layer-id'); // Pegue o ID da layer no DOM
                const layer = stage.findOne(`#${layerId}`); // Encontre a layer correspondente no stage

                if (layer) {
                    // Atualize o atributo de número de página
                    layer.setAttr('pageNumber', index + 1);

                    // Atualize o índice Z para refletir a ordem visual

                }
            });
            updatePageNumbers();
            updateLayerButtons();

            stage.batchDraw();
        }
    });

    $("#models-category").click(function () {
        $("#widget-products").fadeIn(100);
    })
    $("#add-image").click(function () {
        if (drawMode) {
            $("#draw").click();
        }
        if (drawingLineMode) {
            $("#draw-line").click();
        }
        $("#add-image-widget").fadeIn(100);
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
    
        const elementWidth = $("#add-image-widget").outerWidth();
        const elementHeight = $("#add-image-widget").outerHeight();
    
        const left = (windowWidth - elementWidth) / 2;
        const top = (windowHeight - elementHeight) / 2;
    
        $("#add-image-widget").css({
            position: 'absolute',
            left: left + 'px',
            top: top + 'px',
        });
    
    })

    $("#text-font").on('change', function () {
        saveState();
        $(this).css("font-family", $(this).val());
        $("#input-text").css("font-family", $(this).val());
    })
    $("#input-color-edit").on('click', function () {
        saveState();
    });
    $("#input-color-edit").on('input', function () {
        var text = transformer.nodes()[0];
        if(text.strokeWidth() > 0){
            text.fill("rgba(0, 0, 0, 0.0)");
        }else{
            text.fill($(this).val());
        }
        text.stroke($(this).val())
        layer.draw();
        const colorButton = document.getElementById("text-color-button");

        colorButton.style.backgroundColor = this.value;
    });
    $("#input-text-edit").on('input', function () {
        saveState();
        var text = transformer.nodes()[0];

        text.text($(this).val());
        layer.draw();
        var textPosition = text.absolutePosition();
        $("#input-text-edit").css("width", ((Text.width() * Text.getAbsoluteScale().x) * zoom + 'px'));
        $("#input-text-edit").css("height", ((Text.height() * Text.getAbsoluteScale().y) * zoom + 'px'));

    });

    $("#edit-text-input").on('input', function () {
        saveState();
        var text = transformer.nodes()[0];

        text.text($(this).val());
        layer.draw();
        var textPosition = text.absolutePosition();

    });


});
var sliders = ['brightness', 'contrast'];
var drawMode = false;
var drawingLineMode = false;
$('#input-image').on('change', function (e) {
    var imagens = $("#input-image")[0].files;
    $(imagens).each(function (index, value) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64String = event.target.result;
            var src = URL.createObjectURL(value);
            const pictureElement = `
                <div class="item">
                        <img class="item-image" src="${src}" alt="Image ${index + 1}" />
                        <div class="remove-image-btn" ><i class="mdi mdi-close-circle-outline"></i></div>
                </div>
            `;

            $('#images-btn-area').append(pictureElement);
            addImage(src);
        };
        reader.readAsDataURL(value);
    });
    $(this).val('');
});

$('#images-btn-area').on('click', '.remove-image-btn', function (e) {
    var item = $(this).parent();

    item.remove();
})

$('#images-btn-area').on('click', '.item-image', function (e) {

    var imageSrc = $(this).attr("src");
    addImage(imageSrc);
});

$('#background-btn-area').on('click', '.item-background', function (e) {

    $("#add-bg").click();
});
var l = 0;
function addImage(imageSrc) {
    l++
    saveState();
    var imageObj = new Image();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    imageObj.src = imageSrc;
    imageObj.onload = function () {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = imageObj.width;
        tempCanvas.height = imageObj.height;

        tempCtx.drawImage(imageObj, 0, 0);
        const imageSrc = tempCanvas.toDataURL();
        var image = new Konva.Image({
            x: 1,
            y: 1,
            image: imageObj,
            name: 'image',
            id: 'image' + l,
            draggable: true,
            fakeShapeId: "stage",
            imageSrc: imageSrc
        });
        image.cache();
        image.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);

        image.x((stageWidth / 2) - image.width() / 2);
        image.y((stageHeight / 2) - image.height() / 2);
        var groupImage = new Konva.Group({ textId: 'image' + l });
        groupImage.add(image)
        layer.add(image);

        generateImageEvents(image, layer);



        // function getCrop(image, size, clipPosition) {
        //     const width = size.width;
        //     const height = size.height;
        //     const aspectRatio = width / height;

        //     let newWidth;
        //     let newHeight;

        //     const imageRatio = image.width / image.height;

        //     if (aspectRatio >= imageRatio) {
        //         newWidth = image.width;
        //         newHeight = image.width / aspectRatio;
        //     } else {
        //         newWidth = image.height * aspectRatio;
        //         newHeight = image.height;
        //     }

        //     let x = 0;
        //     let y = 0;
        //     if (clipPosition === 'left-top') {
        //         x = 0;
        //         y = 0;
        //     } else if (clipPosition === 'left-middle') {
        //         x = 0;
        //         y = (image.height - newHeight) / 2;
        //     } else if (clipPosition === 'left-bottom') {
        //         x = 0;
        //         y = image.height - newHeight;
        //     } else if (clipPosition === 'center-top') {
        //         x = (image.width - newWidth) / 2;
        //         y = 0;
        //     } else if (clipPosition === 'center-middle') {
        //         x = (image.width - newWidth) / 2;
        //         y = (image.height - newHeight) / 2;
        //     } else if (clipPosition === 'center-bottom') {
        //         x = (image.width - newWidth) / 2;
        //         y = image.height - newHeight;
        //     } else if (clipPosition === 'right-top') {
        //         x = image.width - newWidth;
        //         y = 0;
        //     } else if (clipPosition === 'right-middle') {
        //         x = image.width - newWidth;
        //         y = (image.height - newHeight) / 2;
        //     } else if (clipPosition === 'right-bottom') {
        //         x = image.width - newWidth;
        //         y = image.height - newHeight;
        //     } else if (clipPosition === 'scale') {
        //         x = 0;
        //         y = 0;
        //         newWidth = width;
        //         newHeight = height;
        //     } else {
        //         console.error(
        //             new Error('Unknown clip position property - ' + clipPosition)
        //         );
        //     }

        //     return {
        //         cropX: x,
        //         cropY: y,
        //         cropWidth: newWidth,
        //         cropHeight: newHeight,
        //     };
        // }

        // function applyCrop(pos, image) {
        //     const img = image;
        //     img.setAttr('lastCropUsed', pos);
        //     const crop = getCrop(
        //         img.image(),
        //         { width: img.width(), height: img.height() },
        //         'center-middle'
        //     );
        //     img.setAttrs(crop);
        //     layer.draw();
        // }
        // var crop1 = "center-middle";
        // stage.on('mousedown touchstart', function (e) {
        //     transformer.centeredScaling(false);
        //     if (e.target == transformer.findOne('.middle-left')) {

        //         crop1 = 'right-bottom';

        //     } else if (e.target == transformer.findOne('.middle-right')) {
        //         crop1 = 'left-bottom';

        //     } else if (e.target == transformer.findOne('.bottom-center')) {
        //         crop1 = 'center-top';

        //     } else if (e.target == transformer.findOne('.top-center')) {
        //         crop1 = 'center-bottom';

        //     } else if (e.target == transformer.findOne('.bottom-right')) {
        //         transformer.centeredScaling(true);
        //     }

        // });

        var background = stage.find(".background")[0];
        if (background) {

            if (background.id() == 1) {


                groupImage.zIndex(background.zIndex() - 1);
                stage.find("Text").moveToTop();
                stage.find("Circle").moveToTop();
            } else {

            }
        }

        stage.draw();
        transformer.nodes([image]);
        sliders.forEach(function (attr) {
            $("#" + attr).attr("object-id", image.id())
            $("#" + attr).prop("disabled", false);
        });
        groupTrans.moveToTop();
    }
}


$("#widget-bg-btn").click(function () {
    $("#widget-background").fadeOut(100);
    var editor = $(".preview-img");
    $("#widget-bg2").css("top", editor.offset().top + editor.height() / 2);
    $("#widget-bg2").css("left", editor.offset().left + editor.width() / 2 - $("#widget-bg2").width() / 2);
    $("#widget-bg2").show();

});


function generateImageEvents(image, layer) {
    image.on('click tap', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }

        transformer.nodes([e.target]);
        $("#widget-image").fadeIn(100);

        generateImageWidget(e.target)
        layer.draw();
    });
    image.on('dragstart transformstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            image.stopDrag();
            return;
        }
        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    image.stopDrag();
                    return;
                }
            }
        }

        saveState();
        transformer.nodes([e.target]);
        $("#widget-image").fadeOut(100);
        layer.draw();
    });
    image.on('mouseover touchstart', (e) =>{
        if(drawMode || drawingLineMode){
            $("#shape-border").hide();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }
            }
        }

        $("#shape-border").show();
        adjustShapeBorder(e.target)
    })

    image.on('mouseout touchend', (e) =>{
        $("#shape-border").hide();
    })

    image.on('dragmove', (e) =>{
        adjustShapeBorder(e.target);
    })

    image.on('transform', (e) =>{
        adjustShapeBorder(e.target)
    })

    image.on('transformend dragend', (e) => {
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        $("#widget-image").fadeIn(100);

        generateImageWidget(e.target)
        layer.draw();
    });

    image.on('dragend', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }

        if (e.target.getAttr('fakeShapeId') != "stage") {

            var shape = stage.find("#" + e.target.getAttr('fakeShapeId'))[0];
            var shapexright = shape.x() + (shape.width() * shape.scaleX());
            var shapeybottom = shape.y() + (shape.height() * shape.scaleY());
            var shapeytop = shape.y();
            var shapexleft = shape.x();
            var imageright = e.target.x() + (e.target.width() * e.target.scaleX());
            var imagebottom = e.target.y() + (e.target.height() * e.target.scaleX());
            if ((e.target.x() + 200 > shapexright) || (imageright - 200 < shapexleft)) {
                e.target.rotation(0);
                e.target.x(shape.x() + (shape.width() / 2 * shape.scaleX()) - ((e.target.width() * e.target.scaleX()) / 2));
                e.target.y(shape.y() + (shape.height() / 2 * shape.scaleY()) - ((e.target.height() * e.target.scaleY()) / 2));

            }
            if ((e.target.y() + 200 > shapeybottom) || (imagebottom - 200 < shapeytop)) {
                e.target.rotation(0);
                e.target.x(shape.x() + (shape.width() / 2 * shape.scaleX()) - ((e.target.width() * e.target.scaleX()) / 2));
                e.target.y(shape.y() + (shape.height() / 2 * shape.scaleY()) - ((e.target.height() * e.target.scaleY()) / 2));

            }
        }
        generateImageWidget(e.target)
        layer.draw();
    });

}


function generateImageWidget(image) {
    $("#widget-image").fadeIn(100);

    var imagePosition = image.absolutePosition();

    var stagePosition = $(".konvajs-content").offset();
    var widget = document.getElementById('widget-image');

    const adjustedTop = (stagePosition.top + (imagePosition.y * zoom));
    const adjustedLeft = (stagePosition.left + (imagePosition.x * zoom));

    var positionTop = adjustedTop + (((image.height() * zoom) * image.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((image.width() * zoom) / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height()+4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop+"px";
        widget.style.left = '0px';
        widget.style.width = "100%";
    } else {
        widget.style.position = 'absolute';
        widget.style.top = '50px';
        widget.style.left = positionLeft + 'px';
    }
    $("#widget-figures").fadeOut(100);
}
var v = 0;

var m = 0;


var i = 0;




$("#addText").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    i++;
    if (!$("#input-text").val()) {
        alert("digite um texto!");
        return;
    }

    var Text = new Konva.Text({
        text: $("#input-text").val(),
        fontFamily: $("#text-font").val(),
        x: 200,
        y: stageHeight / 2,
        align: "left",
        fontSize: 100,
        id: i.toString() + 'text',
        draggable: true,
        fill: "black",
        fakeShapeId: 'stage',
        verticalAlign: 'middle',
        stroke: 'black',
        strokeWidth: 0,
        padding: 30,
        name: 'text'
    });
    Text.x((stageWidth / 2) - Text.width() / 2)
    Text.y((stageHeight / 2) - Text.height() / 2)
    var groupText = new Konva.Group({ textId: i.toString() + 'text' });
    groupText.add(Text);
    layer.add(Text);
    transformer.nodes([Text]);
    groupTrans.moveToTop();

    generateTextEvents(Text, layer)
    sliders.forEach(function (attr) {
        $("#" + attr).attr("object-id", Text.id())
    });
    stage.draw();
    $("#input-text").val('');
    $("#add-text-widget").fadeOut(100);
    $("#draggable").fadeIn(100);
    generateTextWidget(Text);
});

$("#editText").click(function () {
    $("#draggable").fadeOut(100);
    $("#widget-fonts").fadeOut(100);
});

function generateTextEvents(text, layer) {
    text.on('transformstart', function (e) {
        saveState();
        $("#draggable").fadeOut(100);
        $("#widget-fonts").fadeOut(100);

    })

    text.on('transformend', function (e) {
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target);
    })


    text.on('transform', function (e){
        adjustShapeBorder(e.target)
    })


    text.on('click tap', (e) => {

        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }
        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        $("#draggable").fadeIn(100);
        transformer.nodes([e.target]);
        generateTextWidget(e.target);
    });

    text.on('dblclick dbltap', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }

        saveState();
        textAreaPosition(e.target)
    });

    text.on('mouseover touchstart', (e) =>{
        if(drawMode || drawingLineMode){
            $("#shape-border").hide();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }
            }
        }

        $("#shape-border").show();
        adjustShapeBorder(e.target)
    })

    text.on('mouseout touchend', (e) =>{
        $("#shape-border").hide();;

    })


    text.on('dragmove', (e) => {
        adjustShapeBorder(e.target)
    });
    text.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            text.stopDrag();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    text.stopDrag();
                    return;
                }
            }
        }

        $("#draggable").fadeIn(100);

        saveState();
        transformer.nodes([]);
        groupTrans.moveToTop();
        layer.draw();
        $("#draggable").fadeOut(100);
        $("#widget-fonts").fadeOut(100);
    });
    text.on('dragend', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        transformer.nodes([e.target]);
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target)
    })
}

function generateTextWidget(Text) {

    var font = Text.fontFamily();
    if ((Text.fontStyle() == "") || (Text.fontStyle() == "normal")) {
        $("#input-text-edit").css("font-style", "normal");
        $("#input-text-edit").css("font-weight", "normal");
        $(".btn-style").removeClass("selected");
    } else if (Text.fontStyle() == "bold") {
        $("#input-text-edit").css("font-weight", "bold");
        $(".btn-style").removeClass("selected");
        $(".btn-style[value='bold']").addClass("selected");
    } else if (Text.fontStyle() == "italic") {
        $("#input-text-edit").css("font-style", "italic");
        $("#input-text-edit").css("font-weight", "normal");
        $(".btn-style").removeClass("selected");
        $(".btn-style[value='italic']").addClass("selected");
    } else if ((Text.fontStyle() == "bold italic") || (Text.fontStyle() == "italic bold")) {
        $("#input-text-edit").css("font-weight", "bold");
        $("#input-text-edit").css("font-style", "italic");
        $(".btn-style").addClass("selected");
    }
    $(".btn-decoration").removeClass("selected");
    $(".btn-decoration[value='" + Text.textDecoration() + "']").addClass("selected");
    $("#input-text-edit").css("text-decoration", Text.textDecoration());
    currentIcon = alignmentIcons[Text.align()];
    $(".btn-align i").attr("class", `fa ${currentIcon}`);
    $("#input-text-edit").val(Text.text());
    if(Text.strokeWidth()>0){
        $(".btn-outline").addClass("selected");
        $("#input-color-edit").val(Text.stroke());
        const colorButton = document.getElementById("text-color-button");
    
        colorButton.style.backgroundColor = Text.stroke();
    }else{
        $("#input-color-edit").val(Text.fill());
        const colorButton = document.getElementById("text-color-button");
    
        colorButton.style.backgroundColor = Text.fill();
        $(".btn-outline").removeClass("selected");
    }
    var span = `<span>${Text.fontFamily()}</span><i class="mdi mdi-menu-down"></i>`
    $("#opacity").val(Text.opacity());
    $("#text-font-edit").html(span);
    $("#text-font-edit").css("font-family", '"' + font + '"');
    $("#input-text-edit").css("font-family", '"' + font + '"');
    $("#edit-text-input").val(Text.text());

    var textPosition = Text.absolutePosition();

    var position = $(".konvajs-content").offset();

    var toolbox = document.getElementById('draggable');
    const adjustedTop = (position.top + (textPosition.y * zoom));
    const adjustedLeft = (position.left + textPosition.x * zoom);
    var positionTop = adjustedTop + (((Text.height() * zoom) * Text.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((Text.width() * zoom) / 2) * Text.getAbsoluteScale().x) - ((toolbox.offsetWidth / 2));
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height() + toolbox.offsetHeight / 2) - 4;
        toolbox.style.position = 'absolute';
        toolbox.style.top = positionTop+"px";
        toolbox.style.left = '0px';
        toolbox.style.width = "100%";
    } else {
        toolbox.style.position = 'absolute';
        toolbox.style.top = '50px';
        toolbox.style.left = positionLeft + 'px';
    }
    $("#widget-figures").fadeOut(100);
}
function textAreaPosition(Text) {
    var textPosition = Text.absolutePosition();
    var position = $(".konvajs-content").offset();
    const adjustedTop = (position.top + (textPosition.y * zoom));
    const adjustedLeft = (position.left + textPosition.x * zoom);
    $("#input-text-edit").css("position", "absolute");
    $("#input-text-edit").css("display", "block");
    $("#input-text-edit").css("z-index", "999999")
    $("#input-text-edit").css("font-size", (Text.fontSize() * Text.getAbsoluteScale().x) * zoom + "px");
    $("#input-text-edit").css("border", "none");
    $("#input-text-edit").css("margin", "0px");
    $("#input-text-edit").css("padding", (Text.padding() * Text.getAbsoluteScale().x) * zoom + "px");
    $("#input-text-edit").css("overflow", "hidden");
    $("#input-text-edit").css("outline", "none");
    $("#input-text-edit").css("resize", "none");
    $("#input-text-edit").css("background", "none");
    $("#input-text-edit").css("color", "rgba(0, 0, 0, 0.0)");
    $("#input-text-edit").css("caret-color", Text.fill());
    $("#input-text-edit").css("line-height", Text.lineHeight());
    $("#input-text-edit").css("text-align", Text.align());
    $("#input-text-edit").css("transform-origin", "top left");
    $("#input-text-edit").css("width", ((Text.width() * Text.getAbsoluteScale().x) * zoom + 'px'));
    $("#input-text-edit").css("height", ((Text.height() * Text.getAbsoluteScale().y) * zoom + 'px'));
    $("#input-text-edit").css("top", adjustedTop);
    $("#input-text-edit").css("left", adjustedLeft);

    var textarea = document.getElementById('input-text-edit');

    textarea.addEventListener('keydown', function (e) {

        if (e.keyCode === 27) {
            removeTextarea();
        }
    });
    var rotation = Text.rotation();
    var transform1 = '';
    if (rotation) {
        transform1 += 'rotateZ(' + rotation + 'deg)';
    }

    textarea.style.transform = transform1;
    function removeTextarea() {
        textarea.style.display = "none";
        window.removeEventListener('click', handleOutsideClick);
        Text.show();
        transformer.show();
        transformer.forceUpdate();
    }

    function handleOutsideClick(e) {
        if (e.target !== textarea) {

            removeTextarea();
        }
    }
    setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
        window.addEventListener('touchstart', handleOutsideClick);
    });
    textarea.focus();
} $('#bgcolor').on('click', saveState)

$('#bgcolor').on('input',
    function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        cor = $('#bgcolor').val();
        var shape = layer.findOne("#" + $('#bgcolor').attr("object-id"))
        shape.setAttrs({
            fill: $('#bgcolor').val()
        });
        layer.draw();
        const colorButton = document.getElementById("bg-color-button");

        colorButton.style.backgroundColor = this.value;
    });
$('#bg-remove').on('click',
    function () {
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var shape = layer.findOne("#" + $('#bgcolor').attr("object-id"))
        shape.destroy()
        $("#widget-bg").fadeOut(100);
        layer.draw();
    });
$('#draw-color').on('click', saveState)
$('#border-color').on('click', saveState)
$("#open-layers-btn").click(function(){
    if($(this).hasClass('active')){
        $("#widget-layers").fadeOut(100);
        $(this).removeClass('active');
    }else{
        $("#widget-layers").fadeIn(100);
        var container = $(this)
        var widgetLayers = $('#widget-layers');
    
        var containerOffset = container.offset();
    
        widgetLayers.css({
            position: 'absolute',
            top: containerOffset.top+10,
            left: containerOffset.left - $('#widget-layers').width()+10,
        });
        $(this).addClass('active')
    }
})

$('#border-color').on('input',
    function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        cor = $('#draw-color').val();
        var shape = transformer.nodes()[0];

        if(shape.stroke() != null){
            shape.stroke($(this).val())
        }else{
            shape.stroke(null)
        }

        layer.draw();
        const colorButton = document.getElementById("border-color-button");

        colorButton.style.backgroundColor = this.value;
    });


$("#btn-text-edit").click(function(){
    $("#widget-text-edit").fadeIn(100);
    var position = $("#draggable").offset();
    var widget = document.getElementById('widget-text-edit');
    var positionTop = position.top;
    var positionLeft = position.left + ($("#draggable").width() / 2 - (widget.offsetWidth / 2));


    widget.style.position = 'fixed';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';

})

$('#draw-color').on('input',
    function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        cor = $('#draw-color').val();
        var shape = transformer.nodes()[0];

        if(shape.fill() == "rgba(0, 0, 0, 0.0)"){
            shape.fill("rgba(0, 0, 0, 0.0)");
            shape.stroke($(this).val())
        }else{
            shape.fill($(this).val());
        }

        layer.draw();
        const colorButton = document.getElementById("shape-color-button");

        colorButton.style.backgroundColor = this.value;
    });
sliders.forEach(function (attr) {

    $('#' + attr).on('mousedown touchstart', saveState);

    $('#' + attr).on('input',
        function () {
            value = $('#' + attr).val();
            var shape = transformer.nodes()[0];
            const porcentagem = (value / $("#" + attr).attr("max")) * 100;
            $("." + attr).text(parseInt(porcentagem) + "%");
            if (shape) {
                shape[attr](parseFloat(value));
                layer.batchDraw();
            }
        });
});

$("#add-tri").on('click', function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.RegularPolygon({
        id: i.toString() + 'tri',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        sides: 3,
        stroke:null,
        strokeWidth:0,
        radius: 200,
        x: stageWidth / 2,
        y: stageHeight / 2,
        name: "draw",
        strokeScaleEnabled: false,
        draggable: true,
    });

    layer.add(shape);
    transformer.nodes([shape]);
    layer.draw();

    generateShapeWidget(shape);
    generateShapeEvents(shape, layer);
    groupTrans.moveToTop();
})

$("#add-star").on("click", function(){
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.Star({
        id: i.toString() + 'star',
        x: stage.width() / 2,
        y: stage.height() / 2,
        numPoints: 6,
        innerRadius: 40,
        outerRadius: 70,
        name: "draw",
        fakeShapeId: 'stage',
        fill: 'yellow',
        stroke:null,
        strokeWidth:"0",
        strokeScaleEnabled: false,
        draggable:true
      });
      layer.add(shape);
      transformer.nodes([shape]);
      layer.draw();
      shape.x((stageWidth / 2) - shape.innerRadius() / 2)
      shape.y((stageHeight / 2) - shape.innerRadius() / 2)
      generateShapeWidget(shape);
      generateShapeEvents(shape, layer);
      groupTrans.moveToTop();
})


$("#add-rect").on('click', function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.Rect({
        id: i.toString() + 'rect',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        width: 200,
        height: 100,
        stroke:null,
        strokeWidth:0,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
        strokeScaleEnabled: false
    });
    shape.x((stageWidth / 2) - shape.width() / 2)
    shape.y((stageHeight / 2) - shape.height() / 2)
    var groupRect = new Konva.Group({ textId: i.toString() + 'rect' });
    groupRect.add(shape);
    layer.add(shape);
    transformer.nodes([shape]);
    layer.draw();
    generateShapeEvents(shape, layer);
    generateShapeWidget(shape);

})

$("#stroke-width").on('input', function(){
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];
    
    shape.setAttrs({
        strokeWidth: $(this).val()
    });
    layer.draw();
})
$("#border-radius").on('input', function() {
    const layer = stage.findOne("#" + $("#currentLayer").val());
    const shape = transformer.nodes()[0];

    if (!shape) {
        console.error("Nenhum objeto selecionado.");
        return;
    }

    // Verifique se o shape suporta 'cornerRadius'
    if (shape instanceof Konva.Rect) {
        const cornerRadiusValue = Number($(this).val());
        shape.setAttrs({
            cornerRadius: cornerRadiusValue
        });
        layer.draw(); // Redesenha a camada
    } 
});


$("#add-square").on('click', function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.Rect({
        id: i.toString() + 'rect',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        width: 200,
        height: 200,
        stroke:null,
        strokeWidth:0,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
    });
    shape.x((stageWidth / 2) - shape.width() / 2)
    shape.y((stageHeight / 2) - shape.height() / 2)
    var groupRect = new Konva.Group({ textId: i.toString() + 'rect' });
    groupRect.add(shape);
    layer.add(shape);
    transformer.nodes([shape]);
    layer.draw();
    generateShapeEvents(shape, layer);
    generateShapeWidget(shape);

})


function adjustShapeBorder(shape){

    const className = shape.getClassName();
    const textPosition = shape.absolutePosition();
    const position = $(".konvajs-content").offset();
    const toolbox = document.getElementById('shape-border');

    let scaledWidth, scaledHeight;
    var adjustedTop;
    var adjustedLeft;
    if (className === "Circle") {
        const radius = shape.radius();
        const scaleX = shape.getAbsoluteScale().x * zoom;
        const scaleY = shape.getAbsoluteScale().y * zoom;
        scaledWidth = scaledHeight = radius * 2 * Math.max(scaleX, scaleY);          
        adjustedTop = (position.top + (textPosition.y * zoom) - (shape.radius() *shape.getAbsoluteScale().y) *zoom);
        adjustedLeft = (position.left + (textPosition.x * zoom) - (shape.radius()*shape.getAbsoluteScale().x) *zoom);
    } else if (className === "Star") {
        const radius = shape.outerRadius();
        const scaleX = shape.getAbsoluteScale().x * zoom;
        const scaleY = shape.getAbsoluteScale().y * zoom;
        scaledWidth = scaledHeight = radius * 2 * Math.max(scaleX, scaleY);
        adjustedTop = (position.top + (textPosition.y * zoom) - (shape.outerRadius() *shape.getAbsoluteScale().y) *zoom);
        adjustedLeft = (position.left + (textPosition.x * zoom) - (shape.outerRadius()*shape.getAbsoluteScale().x) *zoom);
    } else if((className === "Rect")||(className === "Text")||(className === "Image")) {
        // Shape "regular" como Retângulo, Texto, etc.
        scaledWidth = shape.width() * shape.getAbsoluteScale().x * zoom;
        scaledHeight = shape.height() * shape.getAbsoluteScale().y * zoom;
        adjustedTop = (position.top + (textPosition.y * zoom));
        adjustedLeft = (position.left + (textPosition.x * zoom));
    }else if (className === "RegularPolygon") {
        $("#shape-border").hide();

    }
    else if (className === "Line") {
        const points = shape.points(); // Lista de pontos [x1, y1, x2, y2, ...]
        const position = $(".konvajs-content").offset();
    
        // Obtém a posição absoluta do shape (ponto inicial do Line no canvas)
        const absolutePosition = shape.absolutePosition();
    
        // Calcula as coordenadas mínimas e máximas ajustando pela posição absoluta
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < points.length; i += 2) {
            const x = (points[i] * shape.getAbsoluteScale().x * zoom) + (absolutePosition.x * zoom);
            const y = (points[i + 1] * shape.getAbsoluteScale().y * zoom) + (absolutePosition.y * zoom);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    
        // Define largura e altura baseado nos pontos
        scaledWidth = maxX - minX;
        scaledHeight = maxY - minY;
    
        // Calcula a posição ajustada
        adjustedTop = position.top + minY;
        adjustedLeft = position.left + minX;
    }
    // A    // Aplica os tamanhos ao elemento HTML
    $("#shape-border").width(scaledWidth);
    $("#shape-border").height(scaledHeight);




    const positionTop = adjustedTop + (scaledHeight / 2) - (toolbox.offsetHeight / 2);
    const positionLeft = adjustedLeft + (scaledWidth / 2) - (toolbox.offsetWidth / 2);

    // Define a posição do `.shape-border`
    $(".shape-border").css({
        top: `${positionTop}px`,
        left: `${positionLeft}px`,
    });

}

function generateShapeEvents(shape, layer) {
    shape.on('transformstart', function (e) {
        saveState();
        $("#widget-shape").fadeOut(100);
    })

    shape.on('transformend', function (e) {
        generateShapeWidget(e.target)
    })


    shape.on('transform', function(e){
        adjustShapeBorder(e.target);
    })

    shape.on('mouseover touchstart', (e) => {
        if(drawMode || drawingLineMode){
            $("#shape-border").hide();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }
            }
        }

        $("#shape-border").show();
        adjustShapeBorder(e.target)
    });

    shape.on('dragmove' , (e)=>{
        adjustShapeBorder(e.target)
    })

    shape.on('mouseout touchend', (e) => {
        $("#shape-border").hide();
    })

    shape.on('click tap', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                
                    return;
                }
            }
        }

        generateShapeWidget(e.target)
        transformer.nodes([e.target]);
    });


    shape.on('dragend', (e) => {
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
    
                    return;
                }
            }
        }

        generateShapeWidget(e.target);
    });

    shape.on('dragstart', (e) => {
        if(drawMode || drawingLineMode){
            shape.stopDrag();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    shape.stopDrag();
                    return;
                }
            }
        }

        saveState();
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#widget-shape").fadeOut(100);
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        layer.draw();
    });
}

function generateShapeWidget(shape) {
    var nodePosition = shape.getAbsolutePosition();
    var stagePosition = $(".konvajs-content").offset();
    $("#widget-shape").fadeIn(100);
    var widget = document.getElementById('widget-shape');
    widget.style.position = 'absolute';

    const adjustedTop = (stagePosition.top + (nodePosition.y * zoom));
    const adjustedLeft = (stagePosition.left + (nodePosition.x * zoom));

    const className = shape.getClassName();

    if (className === 'Rect') {
        var positionTop = adjustedTop + (((shape.height() * zoom) * shape.getAbsoluteScale().y) + widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2) - ((shape.width() * zoom) / 2) * shape.getAbsoluteScale().x);
        $("#border-radius").val(shape.cornerRadius());
    } else if (className === 'Circle') {
        var positionTop = adjustedTop + (((shape.radius() * zoom) * shape.getAbsoluteScale().y)+ widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2));
    } else if (className === 'RegularPolygon') {
        var positionTop = adjustedTop + (((shape.radius() * zoom) * shape.getAbsoluteScale().y));
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2));
    } else {
        var positionTop = adjustedTop + (((shape.outerRadius()* zoom) * shape.getAbsoluteScale().y) + widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2) - (((shape.innerRadius()/2) * zoom) / 2) * shape.getAbsoluteScale().x);
    }
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height()+4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop+"px";
        widget.style.left = '0px';
        widget.style.width = "100%";
    } else {
        widget.style.position = 'absolute';
        widget.style.top = '50px';
        widget.style.left = positionLeft + 'px';
    }

    const colorButton = document.getElementById("shape-color-button");
    const borderButton = document.getElementById("border-color-button");
    $("#draw-color").attr("disabled", false);
    if(shape.stroke() != null && shape.fill() =="rgba(0, 0, 0, 0.0)"){
        $("#draw-color").val(shape.stroke());
        colorButton.style.backgroundColor = shape.stroke();
        $(".outline-shape").addClass("selected");
    }else{
        $("#draw-color").val(shape.fill());
        $(".outline-shape").removeClass("selected");
        colorButton.style.backgroundColor = shape.fill();
        borderButton.style.backgroundColor = shape.stroke();
    }

    if(shape.stroke() != null){
        $(".border-shape").addClass('selected');
    }else{
        $(".border-shape").removeClass('selected');
    }

    $("#stroke-width").val(shape.strokeWidth());
    $("#widget-figures").fadeOut(100);
    $("#draw-color").attr("object-id", shape.id());
}

$(".item-proj").on('click', function () {
    const filePath = $(this).attr("proj"); // Obtém o caminho do arquivo
    if (filePath) {
        $.ajax({
            url: filePath,
            method: 'GET',
            dataType: 'json',
            success: function (fileContent) {
                try {
                    // Extraia as informações do arquivo JSON
                    const { resolution, layers } = fileContent;

                    // Redimensione o stage, se necessário
                    if (resolution) {
                        setNewCanvasSize(resolution.width, resolution.height);
                        title = resolution.title;
                    }

                    // Restaure as camadas
                    restoreState(layers);

                    // Limpe as pilhas de undo/redo
                    redoStack.length = 0;
                    undoStack.length = 0;

                    // Atualize os botões de undo/redo
                    updateundoRedoBtn();
                } catch (err) {
                    console.error("Erro ao processar o arquivo:", err.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Erro ao carregar o arquivo:", error);
            }
        });
    }
});

$("#background-widget-btn").click(function(){
    $("#add-background-widget").fadeIn(100);
    $("#add-background-widget").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth =  $("#add-background-widget").outerWidth();
    const elementHeight =  $("#add-background-widget").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#add-background-widget").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });

})

$("#add-circle").on('click', function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.Circle({
        id: i.toString() + 'circle',
        fill: Konva.Util.getRandomColor(),
        radius: 100 + Math.random() * 20,
        shadowBlur: 10,
        stroke:null,
        strokeWidth:0,
        fakeShapeId: 'stage',
        x: stageWidth / 2,
        y: stageHeight / 2,
        name: "draw",
        strokeScaleEnabled: false,
        draggable: true,
    });

    var groupCircle = new Konva.Group({ textId: i.toString() + 'circle' });
    groupCircle.add(shape);
    layer.add(shape);
    transformer.nodes([shape]);

    layer.draw();

    generateShapeWidget(shape)
    generateShapeEvents(shape, layer);

    groupTrans.moveToTop();
})

function cleanStage() {
    var layer = stage.findOne("#" + $("#currentLayer").val());
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');

    console.log(userLayers);
    userLayers.forEach((layer) => {
        layer.destroy();
    });
    var newLayer = new Konva.Layer({
        id: "layer" + getRandomInt(1000),
        name: "Pagina 1",
        pageNumber:1,
        zIndex: 1
    });

    
    var background = new Konva.Rect({
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,
        id: "background1",
        name: "background",
        fill: $('#bgcolor').val(),
    });

    generateBackgroundEvents(background, newLayer);
    newLayer.add(background);
    stage.add(newLayer);
    $("#currentLayer").val(newLayer.id())
    updatePageNumbers(); 
    stage.draw();
    updateLayerButtons();
}
var transformer;
var stageWidth;
var stageHeight;
var stage;
var tr;
var layer;
var background;
var group;
var rotateButton;
var sizeButton;
var groupTrans;
var currentLayerId;
var originalStageWidth;
var originalStageHeight;
var layerIndex;
$(function () {

    $(document).tooltip();
    $("#stage-parent").fadeIn(100);
    if ($(window).outerWidth() < 450) {
        stageWidth = 800;
        stageHeight = 600;
    }else{
        stageWidth = 800;
        stageHeight = 600;
        zoomElement.style.transform = `scale(${zoom = $('#zoom-slider').val()})`
    }

    $("body").height($(window).height());

    $("#project-info").text(stageWidth+" x "+stageHeight)
    originalStageWidth = stageWidth;
    originalStageHeight = stageHeight;
    $(".header").text(title + " - " + stageWidth + "x" + stageHeight)
    stage = new Konva.Stage({
        container: 'container',
        width: stageWidth,
        height: stageHeight,
        id: "stage"

    });


    transformer = addTransformer();

    group = new Konva.Group({

    });
    layer = new Konva.Layer({
        id: "layer" + getRandomInt(1000),
        name: "Pagina 1",
        pageNumber:1,
        zIndex: 1
    });
    var transformerLayer = new Konva.Layer({
        id: "transformerLayer",
        zIndex: 0
    });
    stage.add(layer);
    stage.add(transformerLayer);
    layer.zIndex(1)
    transformerLayer.moveToBottom();
    $("#currentLayer").val(layer.id())
    layerIndex = 2;


    background = new Konva.Rect({
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,
        id: "background1",
        name: "background",
        fill: $('#bgcolor').val(),
    });

    layer.draw()
    $('#bgcolor').attr("object-id", background.id());

    generateBackgroundEvents(background, layer);
    var isPaint = false;

    var lastLine;
    stage.on('mouseout', function(){
        if (drawMode) {
            var DrawCursorRadius = stage.findOne("#DrawCursorRadius");

            if (DrawCursorRadius) {
                DrawCursorRadius.visible(true);
            }
            DrawCursorRadius.visible(false);
            stage.listening(true);
        }
    })
    stage.on('mouseover', function () {
        if (drawMode) {
            var pointerPosition = stage.getPointerPosition();
            if (!pointerPosition) return;
            stage.listening(false);
            var scale = stage.scale();
            var stagePosition = stage.position();
            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };
            var DrawCursorRadius = stage.findOne("#DrawCursorRadius");

            if (!DrawCursorRadius) {
                $("#draw").click();
            }
            DrawCursorRadius.visible(true);
            DrawCursorRadius.x(adjustedPosition.x)
            DrawCursorRadius.y(adjustedPosition.y)
            DrawCursorRadius.radius(size / 2);
            DrawCursorRadius.moveToTop();
            if (mode == 'brush') {
                DrawCursorRadius.fill(color);
                DrawCursorRadius.strokeWidth(0);
                $(".editor").css("cursor", "url('images/cursor.cur'), auto")
            } else {
                $(".editor").css("cursor", "url('images/eraser.cur'), auto")
                DrawCursorRadius.fill('rgba(0, 0, 0, 0.0)');
                DrawCursorRadius.strokeWidth(1);
            }
        } else {
            
            $(".editor").css("cursor", "")
        }
    })
    var lineId;
    var drawingLine = false;
    stage.on('mousedown touchstart', function (e) {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        if (drawMode) {
            saveState();
            isPaint = true;
            var pointerPosition = stage.getPointerPosition();
            if (!pointerPosition) return;

            var scale = stage.scale();
            var stagePosition = stage.position();
            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };

            lastLine = new Konva.Line({
                points: [adjustedPosition.x, adjustedPosition.y],
                stroke: color,
                strokeWidth: size,
                globalCompositeOperation:
                    mode === 'brush' ? 'source-over' : 'destination-out',
                lineJoin: 'round',
                lineCap: 'round',
                listening: false,
            });
            var layer = stage.findOne(`#${$("#currentLayer").val()}`);
            layer.add(lastLine);
            var DrawCursorRadius = stage.findOne("#DrawCursorRadius");
            DrawCursorRadius.moveToTop();
            layer.draw();

        } else {

            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", e.target.id())
                $("#" + attr).val(e.target[attr]())
                $("." + attr).text((e.target[attr]()) * 100 + "%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
        }

        if(drawingLineMode){
            saveState();
            var scale = stage.scale();
            var stagePosition = stage.position();
            const pointerPosition1 = stage.getPointerPosition();
            var adjustedPosition = {
                x: (pointerPosition1.x - stagePosition.x) / scale.x,
                y: (pointerPosition1.y - stagePosition.y) / scale.y
            };
            drawingLine = true;
            const pos = stage.getPointerPosition();
             var line = new Konva.Line({
                stroke: lineColor,
                name:"line",
                strokeWidth:lineSize,
                width:lineSize,
                listening: true,
                id:"line"+Math.random(),
                draggable:true,
                points: [adjustedPosition.x, adjustedPosition.y, adjustedPosition.x, adjustedPosition.y]
            });
            generateLineEvents(line,layer)
            lineId = line.id();
            layer.add(line);
            layer.draw();
        }

    });
    let isHandlingEvent = false;

    stage.on('mouseup touchend', function (e) {
        isPaint = false;
        drawingLine = false;
        lineId = 0;
    });
    stage.on('mousemove touchmove', function (e) {
        if (drawMode) {
            

            var pointerPosition = stage.getPointerPosition();

            if (!pointerPosition) return;

            var scale = stage.scale();
            var stagePosition = stage.position();

            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };

            var DrawCursorRadius = stage.findOne("#DrawCursorRadius");

            if (!DrawCursorRadius) {
                $("#draw").click();
                return;
            }

            DrawCursorRadius.x(adjustedPosition.x)
            DrawCursorRadius.y(adjustedPosition.y)
            if (!isPaint) {
                return;
            }
            e.evt.preventDefault();

            var newPoints = lastLine.points().concat([adjustedPosition.x, adjustedPosition.y]);
            lastLine.points(newPoints);


            layer.draw();
        }

        
        if(drawingLine){
            var line = stage.findOne("#"+lineId);
            if (!line) {
                return;
              }
              var scale = stage.scale();
              var stagePosition = stage.position();
              const pointerPosition1 = stage.getPointerPosition();
              var adjustedPosition = {
                  x: (pointerPosition1.x - stagePosition.x) / scale.x,
                  y: (pointerPosition1.y - stagePosition.y) / scale.y
              };
    
              const points = line.points().slice();
              points[2] = adjustedPosition.x;
              points[3] = adjustedPosition.y;
              line.points(points);
              layer.batchDraw();
    
        }
    });
    $(".draw-mode").on('click', function () {
        mode = $(this).attr("draw-mode")
        $(".draw-mode").removeClass("active");
        $(this).addClass("active");
        if (mode == "brush") {
            $(".editor").css("cursor", "url('images/cursor.cur'), auto")
        } else {
            $(".editor").css("cursor", "url('images/eraser.cur'), auto")
        }
    });



    stage.on('click tap dragstart', function (e) {
        
        if ((e.target.name() != 'image') && (e.target.name() != 'button-up') && (e.target.name() != 'draw') && (e.target.name() != 'button-down') && ((e.target.name() != 'text')) && (e.target.name() != 'button-edit') && (e.target.name() != 'button-copy')&& (e.target.name() != 'line')) {

            if(drawMode || drawingLineMode){
                return;
            }

            $("#draggable").fadeOut(100);
            $("#widget-shape").fadeOut(100);
            $("#widget-fonts").fadeOut(100);
            $("#widget-image").fadeOut(100);
            $("#widget-figures").fadeOut(100);
            $("#widget-draw-line").fadeOut(100);
            transformer.nodes([]);
            $("#shape-border").hide();
            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", "0")
                $("#" + attr).prop("disabled", true);
            });
            layer.draw();
            $("#draw-color").val("#ffffff");
            $("#draw-color").attr("disabled", true);
            return;
        }
        if ((e.target.name() === 'image') || (e.target.name() === 'text') || (e.target.name() === 'background') || (e.target.name() === 'draw')) {
            if(drawMode || drawingLineMode){
                return;
            }
            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", e.target.id())
                $("#" + attr).val(e.target[attr]())
                const porcentagem = (e.target[attr]() / $("#" + attr).attr("max")) * 100;
                $("." + attr).text(parseInt(porcentagem) + "%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
            if (e.target.name() != 'text') {
                $("#draggable").fadeOut(100);
                $("#widget-figures").fadeOut(100);
                $("#widget-fonts").fadeOut(100);
                $("#widget-draw-line").fadeOut(100);
            }
            if ((e.target.name() != 'background') || (drawMode)) {
                $("#widget-bg").fadeOut(100);
                $("#widget-figures").fadeOut(100);
                $("#widget-draw-line").fadeOut(100);
            }
            if (e.target.name() != 'draw') {
                $("#widget-bg").fadeOut(100);
                $("#widget-shape").fadeOut(100);
                $("#widget-figures").fadeOut(100);
                $("#widget-draw-line").fadeOut(100);
            }
            if (e.target.name() != 'image') {
                $("#widget-image").fadeOut(100);
                $("#widget-figures").fadeOut(100);
                $("#widget-draw-line").fadeOut(100);
            }
            if (e.target.name() != "background") {
                transformer.nodes([e.target]);
            }
            if (e.target.name() != "line") {
                $("#widget-bg").fadeOut(100);
                $("#widget-draw-line").fadeOut(100);
            }

            groupTrans.moveToTop();

            layer.draw();
            return;
        }


        layer.draw();
    });


    groupTrans = new Konva.Group();
    groupTrans.add(transformer);
    transformerLayer.add(groupTrans);
    transformerLayer.draw();
    layer.add(background);


    layer.add(group);
    layer.draw();
    $(".layers-header").width(243);
    updateLayerButtons();
    setInterval(function () {
        if (!isMousePressed) {
            updateLayerButtons();
        }
    }, 1000);

    adjustContainerToFitStage('#stage-parent', stageWidth, stageHeight);
    fitStageIntoParentContainer();

    window.addEventListener('resize', fitStageIntoParentContainer);

    stage.draw();

});

function generateLineEvents(line,layer){
    
    line.on("mousedown touchstart", function(e){
        if(drawMode || drawingLineMode){
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        generateLineWidget(line,layer);
        transformer.nodes([line])
    })

    line.on('mouseover touchstart', function(e){
        if(drawMode || drawingLineMode){
            $("#shape-border").hide();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }
            }
        }

        $("#shape-border").show();
        adjustShapeBorder(e.target);
    })

    line.on('mouseout touchend', function(e){
        $("#shape-border").hide();
    })
    
    line.on("dragmove",function(e){
        adjustShapeBorder(e.target);
    })

    line.on("transformstart dragstart", function(e){
        if(drawMode || drawingLineMode){
            line.stopDrag();
            return;
        }

        if(e.evt){
            if (e.evt.type.startsWith('touch')) { 
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    line.stopDrag();
                    return;
                }
            }
        }
        saveState();
        generateLineWidget(line,layer);
        transformer.nodes([line])
    })
}


function generateLineWidget(line){
    $("#widget-draw-line").fadeIn(100);

    var position = $(".konvajs-content").offset();
    var widget = document.getElementById('widget-draw-line');
    var positionLeft = position.left + ($(".konvajs-content").width() / 2 - (widget.offsetWidth));

    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height()+4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop+"px";
        widget.style.left = '0px';
        widget.style.bottom = '';
        widget.style.width = "100%";
    } else {
        widget.style.position = 'absolute';
        widget.style.top = '50px';
        widget.style.bottom = '';
        widget.style.right = '';
        widget.style.left = positionLeft + 'px';
    }
    $("#line-color").val(line.stroke());
    $("#line-size").val(line.strokeWidth());
    $("#line-size-text").text(line.strokeWidth());
    const colorButton = document.getElementById("line-color-button");
    colorButton.style.backgroundColor = line.stroke();
}


function generateBackgroundEvents(background, layer) {
    background.on('mouseover', function () {

    });

    background.on("click dbltap", function () {
        if (!drawMode && !drawingLineMode) {
            $("#widget-bg").fadeIn(100);
            var position = $(".preview-img").offset();
            var widget = document.getElementById('widget-bg');
            var positionTop = position.top + $(".preview-img").height()-40;
            var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));

            if ($(window).outerWidth() < 450) {
                var position = $(".editor-panel").offset();
                var positionTop = position.top - ($(".editor-panel").height()+4);
                widget.style.position = 'absolute';
                widget.style.top = positionTop+"px";
                widget.style.left = '0px';
                widget.style.width = "100%";
            } else {
                widget.style.position = 'absolute';
                widget.style.top = '50px';
                widget.style.left = positionLeft + 'px';
            }


        }
    });

    background.on('dragstart', function(){
        $("#widget-bg").fadeOut(100);
    })

    background.on("dragend", function () {
        if (!drawMode) {
            $("#widget-bg").fadeIn(100);
            var position = $(".preview-img").offset();
            var widget = document.getElementById('widget-bg');
            var positionTop = position.top + $(".preview-img").height() + 10;
            var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));

            if ($(window).outerWidth() < 450) {
                var position = $(".editor-panel").offset();
                var positionTop = position.top - ($(".editor-panel").height()+4);
                widget.style.position = 'absolute';
                widget.style.top = positionTop+"px";
                widget.style.left = '0px';
                widget.style.width = "100%";
            } else {
                widget.style.position = 'absolute';
                widget.style.top = '50px';
                widget.style.left = positionLeft + 'px';
            }
        }
    });

}

function fitStageIntoParentContainer() {
    stageParent = document.getElementById('preview');
    const containerWidth = stageParent.offsetWidth;
    const containerHeight = stageParent.offsetHeight;

    const scaleX = containerWidth / originalStageWidth;
    const scaleY = containerHeight / originalStageHeight;
    const scale = Math.min(scaleX, scaleY);
    stage.width(originalStageWidth * scale);
    stage.height(originalStageHeight * scale);
    stage.scale({ x: scale, y: scale });

    stage.batchDraw();
}

$(function () {
    $(".btn-style").on('click', function () {
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            text.fontStyle(text.fontStyle().replace("normal", ''));
            text.fontStyle(text.fontStyle().replace(" ", ''));
            text.fontStyle(text.fontStyle().replace($(this).attr("value"), ''));
        } else {
            text.fontStyle(text.fontStyle().replace("normal", ''));
            text.fontStyle(text.fontStyle().replace(" ", ''));
            $(this).addClass("selected");
            if (text.fontStyle() == "") {
                text.fontStyle($(this).attr("value"));
            } else {
                text.fontStyle(text.fontStyle() + ' ' + $(this).attr("value"));
            }

        }
        layer.draw();
    });

    $(".btn-outline").on('click', function () {
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            text.fill(text.stroke());
            text.strokeWidth(0);
        } else {
            $(this).addClass("selected");
            text.stroke(text.fill());
            text.fill("rgba(0, 0, 0, 0.0)")
            text.strokeWidth(2);
        }
        layer.draw();
    });

$(".outline-shape").on('click', function(){
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];
    if (shape.fill() == 'rgba(0, 0, 0, 0.0)') {
        $(this).removeClass("selected");
        shape.fill($("#draw-color").val());
        shape.strokeWidth(0);
        shape.stroke(null);
    } else {
        $(this).addClass("selected");
        shape.stroke(shape.fill());
        shape.fill("rgba(0, 0, 0, 0.0)")
        shape.strokeWidth($("#stroke-width").val());
    }
    layer.draw();
});

$(".border-shape").on('click', function(){
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];
    if ($(this).hasClass("selected")) {
        $(this).removeClass("selected");
        shape.stroke(null);
        shape.strokeWidth(0);
    } else {
        $(this).addClass("selected");
        shape.stroke("black");
        shape.strokeWidth($("#stroke-width").val());
    }
    layer.draw();
});



    $("#opacity").on('mousedown touchstart', function () {
        saveState();
    });
    $("#opacity").on('input', function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];

        text.opacity($(this).val());
        layer.draw();
    });

    $(".font-item").click(function(){
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        var textContent = text.text();
        text.fontFamily($(this).attr("value"));
        text.text("");
        text.text(textContent);
        layer.draw();
        var span = `<span>${$(this).attr("value")}</span><i class="mdi mdi-menu-down"></i>`
        $("#text-font-edit").html(span);
        $("#text-font-edit").css("font-family", '"' + $(this).attr("value") + '"');
        $("#widget-fonts").fadeOut(100);
    })


    $("#text-font-edit").on('click', function () {
        $("#widget-fonts").css('background-color','background: rgba(47, 51, 54, 1)');
        $("#widget-fonts").css('opacity','1');
        $("#widget-fonts").fadeIn(100);
        var font = $(this).attr('font');
        var position = $(this).offset();
        var position2 = $("#draggable").offset();
        var widget = document.getElementById('widget-fonts');
        var positionTop = position2.top;
        var positionLeft = position2.left + ($("#draggable").width() / 2 - (widget.offsetWidth / 2));
        $("ul").find(`[value='${font}']`).addClass('active');
        if ($(window).outerWidth() < 450) {
            var position = $("#draggable").offset();
            var positionTop = position.top;
            widget.style.position = 'absolute';
            widget.style.top = positionTop+"px";
            widget.style.left = '0px';
            widget.style.width = "100%";
        } else {
            widget.style.position = 'absolute';
            widget.style.top = '50px';
            widget.style.left = positionLeft + 'px';
        }
        
        // var layer = stage.findOne("#" + $("#currentLayer").val());
        // var text = transformer.nodes()[0];
        // $(this).css("font-family", '"' + $(this).val() + '"');
        // var textContent = text.text();
        // text.fontFamily($(this).val());
        // text.text("");
        // text.text(textContent);
        // layer.draw();
    });



    $("#input-text-edit").on('input', function () {
        saveState();
        var text = transformer.nodes()[0];

        text.text($(this).val());
        layer.draw();
        var textPosition = text.absolutePosition();
        $("#input-text-edit").css("width", (text.width() * text.getAbsoluteScale().x + 'px'));
        $("#input-text-edit").css("height", (text.height() * text.getAbsoluteScale().y + 'px'));

    });

    $(".btn-align").on("click", function () {
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        const currentIcon = icons[currentIndex];
        $(this).find("i").attr("class", `fa ${currentIcon}`);

        var text = transformer.nodes()[0];
        if (!text) return;
        const newAlignment = alignments[currentIndex];
        text.align(newAlignment);
        layer.draw();

        currentIndex = (currentIndex + 1) % alignments.length;

    });
    $(".btn-decoration").on('click', function () {
        saveState();
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            text.textDecoration("");
        } else {
            $(".btn-decoration").removeClass("selected");
            $(this).addClass("selected");
            text.textDecoration($(this).attr("value"));
        }


        layer.draw();
    });

    $(".widget").draggable({ disabled: true });
    $(".widget-sm").draggable({ disabled: true });
    $(".widget-header").on('mouseover touchstart', function (e) {
        $(".widget").draggable('enable');
        $(".widget-sm").draggable('enable');
        document.body.style.cursor = 'move';
    });

    $(".widget-header").on('mouseleave touchend', function (e) {
        $(".widget").draggable('disable');
        $(".widget-sm").draggable('disable');
        document.body.style.cursor = 'default';
    });
});
$('#widget-text').on('click', function () {
    if (drawMode) {
        $("#draw").click();
    }
    if (drawingLineMode) {
        $("#draw-line").click();
    }
    $("#add-text-widget").fadeIn(100);
    var position = $(this).offset();
    var widget = document.getElementById('add-text-widget');
    const adjustedTop = (position.top);
    const adjustedLeft = (position.left);

    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($("#add-text-widget").height()-$(this).height());
        widget.style.position = 'absolute';
        widget.style.top = positionTop+"px";
        widget.style.left = '0px';
        widget.style.bottom = '';
    } else {
        widget.style.position = 'absolute';
        widget.style.top = adjustedTop+"px";
        widget.style.left = adjustedLeft+'px';
    }

});


function addTransformer() {
    var sizeImage = new Image();
    var rotateImage = new Image();
    var transformer = new Konva.Transformer({
        anchorStyleFunc: (anchor) => {
            if (anchor.hasName('bottom-right') && sizeImage.complete) {
                anchor.fill('');
                anchor.stroke('');
                anchor.fillPatternImage(sizeImage);

            }
            if (anchor.hasName('rotater') && rotateImage.complete) {
                anchor.fill('');
                anchor.stroke('');
                anchor.fillPatternImage(rotateImage);

            }
            if (anchor.hasName('bottom-right') || anchor.hasName('rotater')) {
                anchor.height(22);
                anchor.width(22)
            } else {
                anchor.height(7);
                anchor.width(7)
            }
        },
        anchorStroke: 'black',
        anchorFill: 'white',
        borderStroke: '#FFD843',
        borderStrokeWidth:"0",
        centeredScaling: true,
        ignoreStroke: true,
        enabledAnchors: [
            'bottom-right', 'middle-right', 'middle-left',
            'bottom-center', 'top-center'
        ],
        keepRatio: true,
        draggable: true,
        nodes: [],
    });

    transformer.flipEnabled(false);
    transformer.anchorCornerRadius(5);


    sizeImage.src = "images/size-icon.png";
    rotateImage.src = "images/edit-icon.png"
    transformer.rotationSnaps([0, 90, 180, 270]);

    return transformer;
}
$("#btn-settings-shape").click(function () {
    $("#widget-settings-shape").fadeIn(100);
    var position = $("#widget-shape").offset();
    var widget = document.getElementById('widget-settings-shape');
    var positionTop = position.top;
    var positionLeft = position.left + ($("#widget-shape").width() / 2 - (widget.offsetWidth / 2));


    widget.style.position = 'fixed';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';

    $("#widget-figures").fadeOut(100);
});

$("#btn-settings").click(function () {
    $("#widget-settings").fadeIn(100);
    var position = $("#widget-image").offset();
    var widget = document.getElementById('widget-settings');
    var positionTop = position.top;
    var positionLeft = position.left + ($("#widget-image").width() / 2 - (widget.offsetWidth / 2));


    widget.style.position = 'fixed';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';

    $("#widget-figures").fadeOut(100);
});

$("#btn-text-settings").click(function () {
    $("#widget-settings-text").fadeIn(100);
    var position = $("#draggable").offset();
    var widget = document.getElementById('widget-settings-text');
    var positionTop = position.top;
    var positionLeft = position.left + ($("#draggable").width() / 2 - (widget.offsetWidth / 2));


    widget.style.position = 'fixed';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';

    $("#widget-figures").fadeOut(100);
});

$("#draw-line").on("click", function () {
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    $(this).css('background-color', "#424344");
    lineColor = $("#line-color").val();
    lineSize = $("#line-size").val();
    $("#line-size-text").text(" " + lineSize);
    if (!drawingLineMode) {
        if(drawMode){
            $("#draw").click();
        }
        var layer = stage.findOne("#" + $("#currentLayer").val());
        drawingLineMode = true;
        $("#widget-draw-line").fadeIn(100);

        const colorButton = document.getElementById("line-color-button");

        colorButton.style.backgroundColor = lineColor;
        var position = $(".preview-img").offset();
        var widget = document.getElementById('widget-draw-line');
        var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));

        if ($(window).outerWidth() < 450) {
            var position = $(".editor-panel").offset();
            var positionTop = position.top - ($(".editor-panel").height()+4);
            widget.style.position = 'absolute';
            widget.style.top = positionTop+"px";
            widget.style.left = '0px';
            widget.style.bottom = '';
            widget.style.width = "100%";
        } else {
            widget.style.position = 'absolute';
            widget.style.bottom = 0;
            widget.style.top = '';
            widget.style.left = positionLeft + 'px';
        }

    } else {
        $(this).css('background', "transparent");
        $("#widget-draw-line").fadeOut(100);
        drawingLineMode  = false;
    }

});

$("#draw").on("click", function () {
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    $(this).css('background-color', "#424344");
    $(".editor").css("cursor", "url('images/cursor.cur'), auto")
    color = $("#brush-color").val();
    size = $("#brush-size").val();
    $("#brush-size-text").text(" " + size);
    if (!drawMode) {
        if(drawingLineMode){
            $("#draw-line").click();
        }
        var layer = stage.findOne("#" + $("#currentLayer").val());
        drawMode = true;
        $("#widget-draw").fadeIn(100);
        if (mode == "brush") {
            $(".draw-mode[draw-mode='brush']").addClass("active");
            $(".draw-mode[draw-mode='eraser']").removeClass("active");
        } else {
            $(".draw-mode[draw-mode='brush']").removeClass("active");
            $(".draw-mode[draw-mode='eraser']").addClass("active");
        }
        const colorButton = document.getElementById("brush-color-button");
        var DrawCursorRadius = new Konva.Circle({
            id: "DrawCursorRadius",
            fill: color,
            radius: size / 2,
            fakeShapeId: 'stage',
            x: stageWidth / 2,
            y: stageHeight / 2,
            name: "draw",
            stroke: 'black',
            strokeWidth: 0,
            listening: false,
            visible:false
        });
        layer.add(DrawCursorRadius);
        DrawCursorRadius.moveToTop()
        colorButton.style.backgroundColor = color;
        var position = $(".preview-img").offset();
        var widget = document.getElementById('widget-draw');
        var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));

        if ($(window).outerWidth() < 450) {
            var position = $(".editor-panel").offset();
            var positionTop = position.top - ($(".editor-panel").height()+4);
            widget.style.position = 'absolute';
            widget.style.top = positionTop+"px";
            widget.style.left = '0px';
            widget.style.width = "100%";
        } else {
            widget.style.position = 'absolute';
            widget.style.bottom = 0;
            widget.style.left = positionLeft + 'px';
        }

        var widget = document.getElementById('widget-draw');
    } else {
        $(this).css('background', "transparent");
        $("#widget-draw").fadeOut(100);
        drawMode = false;
        var DrawCursorRadius = stage.findOne("#DrawCursorRadius");
        DrawCursorRadius.destroy();
    }

});
$("#brush-color,#brush-size").on('mousedown touchstart', saveState)

$("#brush-color,#brush-size").on('input', function () {
    color = $("#brush-color").val();
    size = $("#brush-size").val();

    const colorButton = document.getElementById("brush-color-button");

    $("#brush-size-text").text(" " + size + " ");

    colorButton.style.backgroundColor = this.value;
})

$("#line-color,#line-size").on('mousedown touchstart', saveState)

$("#line-color,#line-size").on('input', function () {
    lineColor = $("#line-color").val();
    lineSize = $("#line-size").val();

    const colorButton = document.getElementById("line-color-button");

    var line = transformer.nodes()[0];

    if (line instanceof Konva.Line) {
        line.stroke($("#line-color").val());
        line.strokeWidth($("#line-size").val());
    }

    $("#line-size-text").text(" " + lineSize + " ");

    colorButton.style.backgroundColor = this.value;
})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function updatePageNumbers() {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');

    const sortedLayers = userLayers.sort((layer1, layer2) => {
        return layer1.getAttr('pageNumber') - layer2.getAttr("pageNumber");
    });

    sortedLayers.forEach((layer, index) => {
        var number = index + 1;
        layer.setAttrs({
            pageNumber: index + 1,
            name:"Pagina "+number
        });
    });

    stage.batchDraw(); // Redesenha o stage
}

function addPage() {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    const newPageNumber = userLayers.length + 1;
    var layer = stage.findOne("#" + $("#currentLayer").val())
    const newLayer = new Konva.Layer({
        id: "layer" + getRandomInt(1000),
        name: "Pagina "+newPageNumber,
        pageNumber: newPageNumber, // Atribua o número da página
        zIndex: userLayers.length // Garante que seja a última na ordem
    });
    $("#currentLayer").val(newLayer.id())

    var background = layer.findOne(".background");
    if (background) {
        var bgCopy = background.clone();
        newLayer.add(bgCopy);
    }
    stage.add(newLayer);
    updatePageNumbers(); 
    stage.draw();
    updateLayerButtons();
}

$("#layers").on('click','#add-layer',function () {
    if (stage.getLayers().length >= 5) {
        return;
    }
    addPage();
});

$("#duplicate-layer").on('click',function () {
    if (stage.getLayers().length >= 5) {
        return;
    }
    saveState();
    var layer = stage.findOne("#" + $("#selected-page").val())
    const clonedLayer = layer.clone();

    clonedLayer.id("layernew" + getRandomInt(1000));

    stage.add(clonedLayer);

    $("#currentLayer").val(clonedLayer.id());
    updateLayerButtons();
    updatePageNumbers();
    $("#widget-page").fadeOut(100);
})

$(".btn-delete-layer").on('click',function (e) {
    e.stopPropagation();
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    let nextLayerId = userLayers[0].id();
    userLayers.forEach((layer) => {
        if (layer.id() !== "transformerLayer" && layer.id() === $("#selected-page").val() && userLayers.length > 1) {
            saveState();
            layer.remove();
            stage.remove(layer);
            layer.destroy();
            stage.draw();

            const buttonLayer = $('#layers').find(`[layer-id='${layer.id()}']`);
            const siblings = buttonLayer.next(".layer");

            if (siblings.length > 0) {

                nextLayerId = buttonLayer.next(".layer").attr("layer-id");

            } else {
                nextLayerId = buttonLayer.prev(".layer").attr("layer-id");
            }


            return;
        }
    });
    $("#currentLayer").val(nextLayerId);
    updatePageNumbers();
    updateLayerButtons();
    $("#widget-page").fadeOut(100);
});

$("#layers").on('click','.btn-page-options',function (e) {
    e.stopPropagation();
    var layer = $(this).parent()[0];
    console.log(layer);
    $("#widget-page").fadeIn(100);
    $("#selected-page").val($(layer).attr("layer-id"));
    var position = $(layer).offset();
    var widget = document.getElementById('widget-page');
    var positionLeft = position.left + ($(layer).width() / 2 - (widget.offsetWidth / 2));
    var positionTop = position.top + ($(layer).parent().height() / 2 - (widget.offsetHeight / 2));
    widget.style.position = 'absolute';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
});


function updateLayerButtons() {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');

    const sortedLayers = userLayers.sort((layer1, layer2) => {
        return layer1.getAttr('pageNumber') - layer2.getAttr("pageNumber");
    });

    let imgPromises = [];

    sortedLayers.forEach(layer2 => {
        if (layer2.id() !== 'transformerLayer') {
            const promise = new Promise(resolve => {
                layer2.toImage({
                    callback: function (img) {
                        resolve({ img, layerId: layer2.id() });
                    }
                });
            });
            imgPromises.push(promise);
        }
    });

    Promise.all(imgPromises).then(images => {
        $('#layers').html("");
        images.forEach(({ img, layerId }) => {
            const layer = stage.findOne("#" + layerId);
            const imgsrc = img.src;

            if (!layer) return;

            const isChecked = layer.visible() ? "checked" : "";

            const buttonHtml = `
                <li class="layer" layer-id="${layerId}">
                    <span class="layer-name">${layer.getAttr("pageNumber")}</span>
                    <button class="btn-page-options" title="Opções" layer_id="${layerId}"><i
                        class="mdi mdi-dots-vertical" aria-hidden="true"></i></button>
                    <input class="check-visible" layer-id="${layerId}" type="checkbox" ${isChecked}>
                    <img src="${imgsrc}" class="layer-img" alt="Layer Image" style="">
                </li>
            `;
            $('#layers').append(buttonHtml);

            const newButton = $('#layers').find(`[layer-id='${layerId}']`);

            if ($("#currentLayer").val() === layerId) {
                newButton.addClass('active');
                background = layer.findOne(".background");
                if (background) {
                    $("#bgcolor").attr("disabled", false);
                    $("#bgcolor").attr("object-id", background.id());
                    $("#bgcolor").val(background.fill());
                    const colorButton = document.getElementById("bg-color-button");

                    colorButton.style.backgroundColor = background.fill();
                } else {
                    $("#bgcolor").attr("disabled", true);

                    $("#bgcolor").val("#ffffff");
                    const colorButton = document.getElementById("bg-color-button");

                    colorButton.style.backgroundColor = "#ffffff";
                }
            }
        });
        $("#layers").append(`<button class="btn-add-layer" title="Adicionar nova camada"
                                id="add-layer"><i class="mdi mdi-plus" aria-hidden="true"></i></button> `)
    });
    // <button class="btn btn-right btn-manage-layer btn-secondary" title="Duplicar camada"
    // id="duplicate-layer"><i class="mdi mdi-layers-triple" aria-hidden="true"></i></button>
    setActiveLayer($("#currentLayer").val());
    var transformerLayer = stage.findOne("#transformerLayer");
    transformerLayer.moveToTop();
    stage.draw();
}
function setActiveLayer(selectedLayerId) {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    userLayers.forEach((layer) => {
        if (layer.id() === selectedLayerId) {
            layer.moveToTop();
            layer.listening(true);
        } else {
            layer.moveToBottom();
            layer.listening(false);
        }
    });
}

$('#layers').on('click', '.layer', function (e) {

    if ($(e.target).is('.check-visible')) {
        return;
    }

    var layer_id = $(this).attr("layer-id");
    $("#currentLayer").val(layer_id);
    layer = stage.findOne('#' + layer_id);
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
  // Salvar cada camada como imagem
    userLayers.forEach((layer, index) => {
        layer.moveToBottom();
    });
    layer.moveToTop();
    updateLayerButtons();
});

$('#layers').on('change', '.check-visible', function () {
    saveState();
    const layer_id = $(this).attr('layer-id');
    const layer = stage.findOne('#' + layer_id);

    if (layer) {

        const isChecked = $(this).is(':checked');
        layer.visible(isChecked);
        readjustBackground();
        stage.batchDraw();
    }
});
function downloadURI(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

$(".btn-delete").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];

    deleteShape(shape, layer);
})

function deleteShape(shape, layer) {
    shape.destroy();

    stage.fire('click');
    layer.draw();
}

function copyShape(shape, layer) {
    i++;
    if (shape.name() === "image") {
        var ShapeClone = shape.clone({
            id: 'imagecopy' + i.toString(),
            y: shape.position().y - (shape.height() * shape.getAbsoluteScale().y),
            name: shape.name(),
        });
        ShapeClone.cache();
    } else {
        var ShapeClone = shape.clone({
            id: i.toString() + "copy",
            y: shape.position().y - (shape.height() * shape.getAbsoluteScale().y),
            name: shape.name(),
        });
    }

    layer.add(ShapeClone);


    groupTrans.moveToTop();
    transformer.nodes([ShapeClone]);
    ShapeClone.zIndex(shape.zIndex() + 1);
    ShapeClone.fire("click");
    layer.draw();
}

$(".btn-copy").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];
    copyShape(shape, layer);

});
$(".moveUp").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];

    var textGroup = layer.find(nd => {
        return nd.getAttr("textId") === shape.id();
    });

    // if (textGroup) {
    //     shape = textGroup[0];
    // }

    shape.moveUp();
    groupTrans.moveToTop();
    layer.draw();

});
$(".moveDown").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];

    var textGroup = layer.find(nd => {
        return nd.getAttr("textId") === shape.id();
    });

    // if (textGroup) {
    //     shape = textGroup[0];
    // }

    shape.moveDown();
    groupTrans.moveToTop();
    layer.draw();
});
$('#zoom-slider').on('input', function () {

    zoomElement.style.transform = `scale(${zoom = $('#zoom-slider').val()})`

});

$("#btn-widget-figures").click(function () {
    $("#widget-figures").fadeIn(100);
    var position = $(".preview-img").offset();
    var widget = document.getElementById('widget-figures');
    var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height()+4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop+"px";
        widget.style.left = '0px';
        widget.style.width = "100%";
    } else {
        widget.style.position = 'absolute';
        widget.style.bottom = 0
        widget.style.left = positionLeft + 'px';
    }

})
$('#reset-zoom').on('click', function () {

    zoomElement.style.transform = `scale(${zoom = 0.8})`;
    $("#zoom-slider").val(0.8);

});
$("#download").click(function () {
    var transformerLayer = stage.findOne("#transformerLayer");
    transformerLayer.remove()
    $('#reset-zoom').click();
    saveImageOriginalScale();
    stage.add(transformerLayer);
});

$('.editor').on("mousemove", function (event) {
    $("#widget-image-zoom").css("pointer-events", 'none');
    var relX = event.pageX - $('.editor').offset().left + 100;
    var relY = event.pageY - $('.editor').offset().top + 200;
    $("#widget-image-zoom").css("top", relY + "px");
    $("#widget-image-zoom").css("left", relX + "px");
});

$("#resize-stage").click(function () {
    const userWidth = $("#resize-input-width").val();
    const userHeight = $("#resize-input-height").val();


    if (userWidth > 0 && userHeight > 0) {
        setNewCanvasSize(userWidth, userHeight);
        $("#resize-stage-prompt").fadeOut(100);
    }
})

$("#resize-stage-prompt-btn").click(function () {
    $("#resize-stage-prompt").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#resize-stage-prompt").outerWidth();
    const elementHeight = $("#resize-stage-prompt").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;
    $("#resize-input-width").val(stageWidth);
    $("#resize-input-height").val(stageHeight);
    $("#resize-stage-prompt").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });
})


$("#new-image").click(function () {

    const userWidth = $("#input-width").val();
    const userHeight = $("#input-height").val();

    if (userWidth > 0 && userHeight > 0) {
        setNewCanvas(userWidth, userHeight);
        // $(".header").text(title + " - " + userWidth + "x" + userHeight)
        $("#new-image-prompt").fadeOut(100);
    }
})


$("#new-image-prompt-btn").click(function () {
    $("#new-image-prompt").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#new-image-prompt").outerWidth();
    const elementHeight = $("#new-image-prompt").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#new-image-prompt").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });
})


function setNewCanvasSize(userWidth, userHeight) {
    $("#reset-zoom").click();
    title = $("#input-title").val();
    originalStageWidth = userWidth;
    originalStageHeight = userHeight;
    stageWidth = userWidth
    stageHeight = userHeight;
    stage.width(userWidth);
    stage.height(userHeight);
    $("#project-title").text(title)
    $("#project-info").text(userWidth+" x "+userHeight)
    adjustContainerToFitStage('#stage-parent', userWidth, userHeight);
    fitStageIntoParentContainer();
    stage.batchDraw();
    readjustBackground();
}

function readjustBackground() {
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var background = stage.find('.background');
    if (background) {
        background.forEach(bg => {
            const scale = stage.scaleX();
            const position = stage.position();


            bg.width(stage.width() / scale);
            bg.height(stage.height() / scale);
            bg.x(-position.x / scale);
            bg.y(-position.y / scale);

            layer.draw();
        });
    }

}

function setNewCanvas(userWidth, userHeight) {
    $("#reset-zoom").click();
    title = $("#input-title").val();
    originalStageWidth = userWidth;
    originalStageHeight = userHeight;
    stageWidth = userWidth
    stageHeight = userHeight;
    stage.width(userWidth);
    stage.height(userHeight);
    cleanStage();
    stage.batchDraw();
    $("#project-title").text(title)
    $("#project-info").text(userWidth+" x "+userHeight)
    adjustContainerToFitStage('#stage-parent', userWidth, userHeight);
    fitStageIntoParentContainer();
    readjustBackground();
    transformer.moveToTop();
}
function adjustContainerToFitStage(containerId, stageWidth, stageHeight) {
    const container = document.querySelector(containerId);
    const container2 = document.querySelector("#preview");
    const containerWidth = container2.offsetWidth;
    const containerHeight = container2.offsetHeight;
    const scaleX = containerWidth / originalStageWidth;
    const scaleY = containerHeight / originalStageHeight;
    const scale = Math.min(scaleX, scaleY);

    container.style.width = stageWidth * scale + "px";
    container.style.height = stageHeight * scale + "px";

}




let initialDistance = null;

detectElement.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    }
});

detectElement.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && initialDistance) {
        // Calcular a distância atual entre os dedos
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        e.preventDefault();
        // Calcular o fator de zoom
        const scaleChange = currentDistance / initialDistance;
        zoom *= scaleChange;

        // Limitar o zoom a um intervalo adequado, se necessário
        zoom = Math.min(Math.max(zoom, 0.5), 3); // Exemplo: mínimo 0.5x, máximo 3x

        // Aplicar o zoom ao elemento
        zoomElement.style.transform = `scale(${zoom})`;

        // Atualizar a distância inicial para o próximo movimento
        initialDistance = currentDistance;
        $("#zoom-slider").val(zoom);
    }
});

detectElement.addEventListener("touchend", function (e) {
    if (e.touches.length < 2) {
        initialDistance = null; // Resetar quando um dedo é retirado
    }
});


detectElement.addEventListener("wheel", function (e) {
    if (!e.ctrlKey) return;

    e.preventDefault();

    if (e.deltaY > 0) {
        zoomElement.style.transform = `scale(${zoom -= ZOOM_SPEED})`;
        console.log(zoom);
    } else {
        zoomElement.style.transform = `scale(${zoom += ZOOM_SPEED})`;
    }

    $("#zoom-slider").val(zoom);
});

function saveImageOriginalScale() {

    const currentScale = stage.scaleX();
    stage.scale({ x: 1, y: 1 });
    stage.width(originalStageWidth);
    stage.height(originalStageHeight);
    stage.batchDraw();

    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
  // Salvar cada camada como imagem
  var zip = new JSZip();
  var promises = [];
  
  userLayers.forEach((layer, index) => {
      const promise = new Promise((resolve) => {
          layer.toImage({
              callback: function (image) {
                  const canvas = document.createElement('canvas');
                  canvas.width = image.width;
                  canvas.height = image.height;
  
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(image, 0, 0);
  
                  canvas.toBlob((blob) => {
                      zip.file(`${layer.name() || "layer"}_${index + 1}.png`, blob);
                      resolve();
                  });
              }
          });
      });
      promises.push(promise);
  });
  
  Promise.all(promises).then(() => {
      zip.generateAsync({ type: "blob" }).then(function (content) {
          saveAs(content, title+".zip"); // Salva o ZIP com o nome 'modelo.zip'
      });
  });

    fitStageIntoParentContainer();

}
$(document).on('mousedown touchstart', function (e) {
    // Lista de IDs ou classes dos elementos permitidos
    const allowedSelectors = [
        "canvas",
        "textarea", 
        ".widget-sm",
        ".widget-lg",
        ".widget"
    ];

    const isClickAllowed = allowedSelectors.some(selector => 
        $(e.target).closest(selector).length
    );

    if (!isClickAllowed && !drawingLineMode) {
        var transformers = stage.find('Transformer');
        if (transformers.length > 0) {
            for (var i = 0; i < transformers.length; i++) {
                transformers[i].nodes([]);
                $("#shape-border").hide();
            }
            layer.draw();

            // Esconda os widgets
            const widgets = [
                ".widget-sm",
                ".widget-lg",
                ".widget"
            ];

            widgets.forEach(widget => {
                $(widget).fadeOut(100);
            });
        }
    }
});