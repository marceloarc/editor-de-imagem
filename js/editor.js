const fontFamilies = [
    "Abel", "Abril Fatface", "Alex Brush", "Great Vibes", "Acme", "Allerta", 
    "Bungee Shade", "Press Start 2P", "Italiana", "Mountains of Christmas", 
    "Pattaya", "Petit Formal Script", "Pinyon Script", "Sarina", "Sofia", 
    "Special Elite", "Ultra", "Permanent Marker", "Caesar Dressing", "Chewy", 
    "Cinzel", "Courgette", "Dynalight", "Fontdiner Swanky", "Holtwood One SC", 
    "Megrim", "Artifika", "Barrio", "Berkshire Swash", "Bigelow Rules", 
    "Margarine", "Modak", "Monofett", "Monoton", "Alegreya", "Alegreya Sans", 
    "Anton", "Archivo", "Archivo Black", "Archivo Narrow", "Arimo", "Arvo", 
    "Asap", "Asap Condensed", "Bitter", "Bowlby One SC", "Bree Serif", "Cabin", 
    "Cairo", "Catamaran", "Crete Round", "Crimson Text", "Cuprum", "Dancing Script", 
    "Dosis", "Droid Sans", "Droid Serif", "EB Garamond", "Exo", "Exo 2", 
    "Faustina", "Fira Sans", "Fjalla One", "Francois One", "Gloria Hallelujah", 
    "Hind", "Inconsolata", "Indie Flower", "Josefin Sans", "Julee", "Karla", 
    "Lato", "Libre Baskerville", "Libre Franklin", "Lobster", "Lora", "Mada", 
    "Manuale", "Maven Pro", "Merriweather", "Merriweather Sans", "Montserrat", 
    "Montserrat Subrayada", "Mukta Vaani", "Muli", "Noto Sans", "Noto Serif", 
    "Nunito", "Open Sans", "Open Sans Condensed:300", "Oswald", "Oxygen", 
    "PT Sans", "PT Sans Caption", "PT Sans Narrow", "PT Serif", "Pacifico", 
    "Passion One", "Pathway Gothic One", "Play", "Playfair Display", "Poppins", 
    "Questrial", "Quicksand", "Raleway", "Roboto", "Roboto Condensed", "Roboto Mono", 
    "Roboto Slab", "Ropa Sans", "Rubik", "Saira", "Saira Condensed", "Saira Extra Condensed", 
    "Saira Semi Condensed", "Sedgwick Ave", "Sedgwick Ave Display", "Shadows Into Light", 
    "Signika", "Slabo 27px", "Source Code Pro", "Source Sans Pro", "Spectral", 
    "Titillium Web", "Ubuntu", "Ubuntu Condensed", "Varela Round", "Vollkorn", 
    "Work Sans", "Yanone Kaffeesatz", "Zilla Slab", "Zilla Slab Highlight"
];

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
var lastPageId;
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
    lastPageId = $("#currentLayer").val();
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
function restoreImage(image, layer, currentShape = false) {
    const imageSrc = image.getAttr("imageSrc");
    const restoredImageObj = new Image();

    restoredImageObj.onload = function () {
        image.image(restoredImageObj);
        image.cache();
        image.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
        if(currentShape){

            image.fire('click');

        }

    };
    restoredImageObj.src = imageSrc;
}

function saveToCustomFormat() {
    // Obtenha o JSON do stage
    saveState()

    const stageResolution = {
        width: originalStageWidth,
        height: originalStageHeight,
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
    updateLayerButtons();
}


$("#save").click(function () {
    saveToCustomFormat();
})
$("#import").click(function () {
    $("#input-import").click();
})

$('#input-import').on('change', function (e) {
    const file = e.target.files[0]; // Obtém o arquivo
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
         
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
                fitStageIntoParentContainer();
                updateundoRedoBtn();
                updateLayerButtons();
        
            
        };
        reader.readAsText(file);
    }
});
function restoreState(stack) {
    if (stack.length === 0) return;
    var teste = false;
    const state = stack;
    const currentShape = transformer.nodes()[0];
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    userLayers.forEach((layer) => {
        layer.destroy();
    });
    state.forEach(layerJSON => {
        const layer = Konva.Node.create(layerJSON);
        generateLayerEvents(layer);
        const groups = Array.from(layer.find('Group'));
        const userPages = groups.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
        userPages.forEach(page => {
            const group = page.findOne(".grupo");
            generateGroupEvents(group);
            const objects = group.getChildren();
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

                    restoreImage(obj, layer, currentShape && obj.id() === currentShape.id());
                    generateImageEvents(obj, layer);
                    return;
                } else if (obj instanceof Konva.Rect) {
                    if (obj.name() == "background") {
                        generateBackgroundEvents(obj, layer);
                    } else {
                        generateShapeEvents(obj, layer);
                    }
                } else if (obj instanceof Konva.RegularPolygon) {
                    generateShapeEvents(obj, layer);
                } else if (obj instanceof Konva.Line) {
                    generateLineEvents(obj, layer);
                }
                else if(obj.name()=="groupImage"){

                    image = obj.findOne(".bgImage");
                    if(image){
                        restoreImage(image);
                        generateBackgroundEvents(image);
                    }
    
                }
                if (currentShape) {

                    if (obj.id() == currentShape.id()) {
                        stage.fire('click', { target: obj });
                        obj.fire('click');
                    }
                }
            });
            if(page.id()=== lastPageId){
                $("#currentLayer").val(page.id());
                teste = true;
            }
        })


        stage.add(layer);
    });
    if(!teste){
        var layer = stage.findOne("#layer-main");
        $("#currentLayer").val(layer.findOne("Group").id());
    }

    setTimeout(updateLayerButtons, 300)


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

$("#export-prompt").click(function () {
    var stagePosition = $(this).offset();
    var widget = document.getElementById('widget-export');
    $("#widget-export").fadeIn(100);
    const adjustedTop = (stagePosition.top);
    const adjustedLeft = (stagePosition.left);
    widget.style.position = 'absolute';
    widget.style.top = adjustedTop + 10 + "px";
    widget.style.right = "10px";
})

$("#new-prompt").click(function () {
    var stagePosition = $(this).offset();
    var widget = document.getElementById('widget-new');
    $("#widget-new").fadeIn(100);
    const adjustedTop = (stagePosition.top);
    const adjustedLeft = (stagePosition.left);
    widget.style.position = 'absolute';
    widget.style.top = adjustedTop + "px";
    widget.style.left = adjustedLeft + $(this).outerWidth() + 'px';
    if ($(window).outerWidth() < 450) {
        widget.style.top = "";
        widget.style.bottom = "0px";
    }
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
        var layer = stage.findOne("#" + $("#currentLayer").val());
        if (transformer.nodes().length > 0) {
            saveState();
            var shape = transformer.nodes()[0];
            deleteShape(shape, layer);
            updateLayerButton();
        }
        var handle = stage.findOne('.handle')

        if(handle){
            var line = stage.findOne("#"+handle.getAttr('attachedTo'));
            if (line instanceof Konva.Line) {
                deleteShape(line, layer);
                handle.destroy();
                var border = stage.findOne(".lineBorder");
                if(border){
                    border.destroy();
                }
            }
        
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
            updateLayerButton();
        }
    }
    if (e.ctrlKey && e.key === "z") {
        undo();
    } else if (e.ctrlKey && e.key === "y") {
        redo();
    }
});

$(document).ready(function () {


    const $fontContainer = $("#font-select");

    fontFamilies.forEach(font => {
        const fontItem = `
            <span class="font-item" value="${font}" style="font-family: '${font}'; display: block;">
                ${font}
            </span>`;
            $fontContainer.append(fontItem);
    });


    let isDragging = false;
    let isDragging2 = false;
    let startX, startY, scrollLeft, scrollTop;
    getIcons();
    getImages("background","background-btn-area");
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
            $(".editor").css("cursor", "")
            $("#draw-line").css("background", 'transparent');
        }
        if (parent.hasClass('layers-header')) {
            if ($("#open-layers-btn").hasClass('active')) {
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
        distance: 0,
        tolerance: "pointer",
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
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        if (text.strokeWidth() > 0) {
            text.fill("rgba(0, 0, 0, 0.0)");
        } else {
            text.fill($(this).val());
        }
        text.stroke($(this).val())
        layer.draw();
        const colorButton = document.getElementById("text-color-button");

        colorButton.style.backgroundColor = this.value;
    });


    $("#edit-text-input").on('input', function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        saveState();
        var text = transformer.nodes()[0];

        text.text($(this).val());
        layer.draw();
 
  
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

function attachTransformer(node){
    var className = node.getClassName();

    if(className==="Line"){
        updateHandles(node);
        transformer.nodes([]);
    }else{
        stage.find('.handle').forEach((node) => {
            node.destroy()
        })
        var border = stage.findOne(".lineBorder");
        if(border){
            border.destroy();
        }
        transformer.nodes([node]);
    }
}

$('#images-btn-area').on('click', '.remove-image-btn', function (e) {
    var item = $(this).parent();

    item.remove();
})

$('#images-btn-area').on('click', '.item-image', function (e) {

    var imageSrc = $(this).attr("src");
    addImage(imageSrc);
});

$('#model-btn-area').on('click', '.model-background', function (e) {

    $("#add-bg").click();
});
var l = 0;
function addImage(imageSrc) {
    l++
    saveState();
    var imageObj = new Image();
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
    imageObj.src = imageSrc;
    imageObj.crossOrigin = "anonymous";
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

        var bg = stage.findOne(".background");
        image.x((bg.x() + bg.width() / 2) - image.width() / 2)
        image.y((bg.y() + bg.height() / 2) - image.height() / 2)

        group.add(image)

        generateImageEvents(image, layer);

        stage.draw();
        attachTransformer(image);
        sliders.forEach(function (attr) {
            $("#" + attr).attr("object-id", image.id())
            $("#" + attr).prop("disabled", false);
        });
        groupTrans.moveToTop();
        updateLayerButton();
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

        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }

        attachTransformer(e.target);
        $("#widget-image").fadeIn(100);

        generateImageWidget(e.target)
        layer.draw();
    });
    image.on('dragstart transformstart', (e) => {

        if (drawMode || drawingLineMode) {
            e.target.stopDrag();
            return;
        }
        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    e.target.stopDrag();
                    return;
                }
                if (e.evt.touches && e.evt.touches.length === 1) {
                    if(transformer.nodes()[0] != e.target){
                        e.target.stopDrag();
                        return;
                    }
                }
            }
        }

            $("#widget-image").fadeOut(100);


        saveState();
      
        layer.draw();
    });
    image.on('mouseover', (e) => {
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
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

    image.on('mouseout touchend', (e) => {
        $("#shape-border").hide();
    })

    image.on('dragmove', (e) => {
        adjustShapeBorder(e.target);
    })

    image.on('transform', (e) => {
        adjustShapeBorder(e.target)
    })

    image.on('transformend dragend', (e) => {
        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        

        updateLayerButton();
        if(transformer.nodes()[0]===e.target){
            generateImageWidget(e.target)
        }

        layer.draw();
    });

    image.on('mousedown', (e) => {
        if (drawMode || drawingLineMode) {
            return;
        }
        attachTransformer(e.target);
        generateImageWidget(e.target)
    });

    image.on('dragend', (e) => {

        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
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
        if(transformer.nodes()[0]===e.target){
            generateImageWidget(e.target)
        }

        layer.draw();
    });

}


function getLineGuideStops(skipShape) {
    // we can snap to stage borders and the center of the stage
    var vertical = [0, stage.width() / 2, stage.width()];
    var horizontal = [0, stage.height() / 2, stage.height()];

    // and we snap over edges and center of each object on the canvas
    stage.find('.text').forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      var box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });
    stage.find('.draw').forEach((guideItem) => {
        if (guideItem === skipShape) {
          return;
        }
        var box = guideItem.getClientRect();
        // and we can snap to all edges of shapes
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
      });
      stage.find('.image').forEach((guideItem) => {
        if (guideItem === skipShape) {
          return;
        }
        var box = guideItem.getClientRect();
        // and we can snap to all edges of shapes
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
      });
      stage.find('.line').forEach((guideItem) => {
        if (guideItem === skipShape) {
          return;
        }
        var box = guideItem.getClientRect();
        // and we can snap to all edges of shapes
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
      });
    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }

  var width = window.innerWidth;
  var height = window.innerHeight;
  var GUIDELINE_OFFSET = 5;


  function getObjectSnappingEdges(node) {
    var box = node.getClientRect();
    var absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: 'start',
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: 'end',
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: 'start',
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: 'end',
        },
      ],
    };
  }



function getGuides(lineGuideStops, itemBounds) {
    var resultV = [];
    var resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    var guides = [];

    // find closest snap
    var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snap: minH.snap,
      });
    }
    return guides;
  }


function drawGuides(guides) {
    const layer = stage.findOne("#layer-main");
    guides.forEach((lg) => {
      if (lg.orientation === 'H') {
        var line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(255, 166, 0)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === 'V') {
        var line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: 'rgb(255, 196, 0)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }


function generateImageWidget(image) {
    $("#widget-image").fadeIn(100);

    var imagePosition = image.absolutePosition();

    var stagePosition = $(".konvajs-content").offset();
    var widget = document.getElementById('widget-image');

    const adjustedTop = (stagePosition.top + (imagePosition.y));
    const adjustedLeft = (stagePosition.left + (imagePosition.x));
    $(".slider-opacity").val(image.opacity());
    var positionTop = adjustedTop + (((image.height()) * image.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((image.width()) / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height() + 4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop + "px";
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
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    i++;
    if (!$("#input-text").val()) {
        alert("digite um texto!");
        return;
    }

    var Text = new Konva.Text({
        text: $("#input-text").val(),
        fontFamily: fontFamilies[0],
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
        padding: 10,
        name: 'text'
    });
    var bg = page.findOne(".background");

    Text.x((bg.x() + bg.width() / 2) - Text.width() / 2)
    Text.y((bg.y() + bg.height() / 2) - Text.height() / 2)
    Text.width(Text.getWidth()+50);
    const group = page.findOne(".grupo");
    group.add(Text);
    attachTransformer(Text);
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
    updateLayerButton();
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
        updateLayerButton();
    })


    text.on('transform', function (e) {
        adjustShapeBorder(e.target)
        const text = e.target;
        // Obtendo altura e largura separadamente
        const MIN_WIDTH = 50;
        const MIN_FONT_SIZE = 6;
        if (transformer.getActiveAnchor() === "middle-left" || transformer.getActiveAnchor() === "middle-right") {
        
            text.setAttrs({
                width: Math.max(text.width() * text.scaleX(), MIN_WIDTH),
                scaleX: 1,
                scaleY: 1,
              });
        } else if (transformer.getActiveAnchor() === "top-center" || transformer.getActiveAnchor() === "bottom-center") {

        }else if ((transformer.getActiveAnchor() === "bottom-right")||(transformer.getActiveAnchor() === "bottom-left")||(transformer.getActiveAnchor() === "top-left")||(transformer.getActiveAnchor() === "top-right")) {
            const currentFontSize = text.fontSize(); // Tamanho atual da fonte
            const currentScaleX = text.scaleX(); // Captura o fator de escala atual
            const currentWidth = text.width(); // Largura atual do texto
        
            // Calcula o novo tamanho da fonte com base na escala aplicada
            const newFontSize = Math.max(currentFontSize * currentScaleX, MIN_FONT_SIZE);
        
            // Calcula a nova largura com base na escala e adiciona um offset para evitar quebra de linha
            const newWidth = Math.max(currentWidth * currentScaleX, MIN_WIDTH);
            
            text.setAttrs({
                fontSize: newFontSize, // Define o novo tamanho da fonte
                width: newWidth, // Ajusta a largura do texto
                scaleX: 1, // Reseta a escala para evitar acúmulo
                scaleY: 1, // Reseta a escala no eixo Y também
            });
        
            // Ajusta a posição X do texto se o alinhamento não for à esquerda
            if (text.align() !== "left") {
                let deltaX = (newWidth - currentWidth) / 2; // Para alinhamento 'center'
                if (text.align() === "right") {
                    deltaX *= -1; // Ajusta para alinhamento à direita
                }
        
                text.x(text.x() - deltaX); // Move o texto para manter o alinhamento visual
            }
        }
    })


    text.on('click tap', (e) => {

        if (drawMode || drawingLineMode) {
            return;
        }
        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        $("#draggable").fadeIn(100);

        attachTransformer(e.target);
        generateTextWidget(e.target);
    });

    text.on('dblclick dbltap', (e) => {

        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
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

    text.on('mousedown', (e) => {
        if (drawMode || drawingLineMode) {
            return;
        }
        attachTransformer(e.target);
        generateTextWidget(e.target);
    });

    text.on('mouseover', (e) => {
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
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

    text.on('mouseout touchend', (e) => {
        $("#shape-border").hide();;

    })

    text.on('dragmove', (e) => {
        adjustShapeBorder(e.target)
    });
    text.on('dragstart', (e) => {

        if (drawMode || drawingLineMode) {
            e.target.stopDrag();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    e.target.stopDrag();
                    return;
                }
                if (e.evt.touches && e.evt.touches.length === 1) {
                    if(transformer.nodes()[0] != e.target){
                        e.target.stopDrag();
                        return;
                    }
                }
            }
        }

        if(transformer.nodes()[0]===e.target){
            $("#draggable").fadeIn(100);
        }


        saveState();
        groupTrans.moveToTop();
        $("#draggable").fadeOut(100);
        $("#widget-fonts").fadeOut(100);

    });
    text.on('dragend', (e) => {

        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        if(transformer.nodes()[0]===e.target){
            $("#draggable").fadeIn(100);
        }

        generateTextWidget(e.target)
        updateLayerButton();
    })
}
function saveClippedArea() {
    const layer = stage.findOne("#layer-main");
    const layers = Array.from(layer.find('Group'));
    const userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
    const zip = new JSZip(); // Instância do ZIP
    const promises = []; // Lista de Promises para processamento das camadas
    var wasVisible = true;
    userLayers.forEach((layer, index) => {

        layer.visible(true);

        promises.push(
            new Promise((resolve) => {

                const group = layer.findOne(".grupo");
                const background = group.findOne(".background");
                const originalScale = group.scale(); // Salva a escala original

                // Temporariamente ajusta a escala para 1
                group.scale({ x: 1, y: 1 });

                // Gera um canvas para a área visível do grupo
                const canvas = group.toCanvas({
                    x: background.getAbsolutePosition().x,
                    y: background.getAbsolutePosition().y,
                    width: background.width(),
                    height: background.height(),
                });

                // Converte o canvas em blob e adiciona ao ZIP
                canvas.toBlob((blob) => {
                    zip.file(`${layer.name() || "layer"}_${index + 1}.png`, blob);
                    resolve();
                });

                // Restaura a escala do grupo
                group.scale(originalScale);
            })
        );
    });

    // Aguarda todas as promessas concluírem e salva o ZIP
    Promise.all(promises).then(() => {
        zip.generateAsync({ type: "blob" }).then((content) => {
            saveAs(content, `${title || "modelo"}.zip`);
        });
        updateLayerButtons();
    });
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
    if (Text.strokeWidth() > 0) {
        $(".btn-outline").addClass("selected");
        $("#input-color-edit").val(Text.stroke());
        const colorButton = document.getElementById("text-color-button");

        colorButton.style.backgroundColor = Text.stroke();
    } else {
        $("#input-color-edit").val(Text.fill());
        const colorButton = document.getElementById("text-color-button");

        colorButton.style.backgroundColor = Text.fill();
        $(".btn-outline").removeClass("selected");
    }
    var span = `<span>${Text.fontFamily()}</span><i class="mdi mdi-menu-down"></i>`
    $(".slider-opacity").val(Text.opacity());
    $("#text-font-edit").html(span);
    $("#text-font-edit").css("font-family", '"' + font + '"');
    $("#input-text-edit").css("font-family", '"' + font + '"');
    $("#edit-text-input").val(Text.text());

    var textPosition = Text.absolutePosition();

    var position = $(".konvajs-content").offset();

    var toolbox = document.getElementById('draggable');
    const adjustedTop = (position.top + (textPosition.y));
    const adjustedLeft = (position.left + textPosition.x);
    var positionTop = adjustedTop + (((Text.height()) * Text.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((Text.width()) / 2) * Text.getAbsoluteScale().x) - ((toolbox.offsetWidth / 2));
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height() + toolbox.offsetHeight / 2) - 4;
        toolbox.style.position = 'absolute';
        toolbox.style.top = positionTop + "px";
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
    const adjustedTop = (position.top + (textPosition.y));
    const adjustedLeft = (position.left + textPosition.x);
    $("#input-text-edit").css("wordWrap", "break-word");
    $("#input-text-edit").css("whiteSpace", "pre-wrap");
    $("#input-text-edit").css("position", "absolute");
    $("#input-text-edit").css("display", "block");
    $("#input-text-edit").css("z-index", "999999")
    $("#input-text-edit").css("font-size", (Text.fontSize() * Text.getAbsoluteScale().x) + "px");
    $("#input-text-edit").css("border", "none");
    $("#input-text-edit").css("margin", "0px");
    $("#input-text-edit").css("padding", (Text.padding() * Text.getAbsoluteScale().x) + "px");
    $("#input-text-edit").css("overflow", "hidden");
    $("#input-text-edit").css("outline", "none");
    $("#input-text-edit").css("resize", "none");
    $("#input-text-edit").css("background", "none");
    $("#input-text-edit").css("transform-origin", "top left");
    $("#input-text-edit").css("caret-color", Text.fill());
    $("#input-text-edit").css("color", Text.fill());
    $("#input-text-edit").css("line-height", Text.lineHeight());
    $("#input-text-edit").css("text-align", Text.align());
    $("#input-text-edit").css("width", ((Text.width() * Text.getAbsoluteScale().x) + 'px'));
    $("#input-text-edit").css("height", ((Text.height() * Text.getAbsoluteScale().y) + 'px'));
    $("#input-text-edit").css("top", adjustedTop);
    $("#input-text-edit").css("left", adjustedLeft);
    var textarea = document.getElementById('input-text-edit');
    Text.visible(false);
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
        var layer = stage.findOne("#layer-main");
        var page = layer.findOne("#" + $("#currentLayer").val());
        var group = page.findOne(".grupo");
        cor = $('#bgcolor').val();
        var shape = group.findOne(".background");

        shape.setAttrs({
            fill: $('#bgcolor').val()
        });
        layer.draw();
        const colorButton = document.getElementById("bg-color-button");

        colorButton.style.backgroundColor = this.value;
        updateLayerButton();
    });
$('#bg-remove').on('click',
    function () {
        saveState();
        var layer = stage.findOne("#layer-main");
        var page = layer.findOne("#" + $("#currentLayer").val());
        var group = page.findOne(".grupo");
        var bgImage = group.findOne(".groupImage");

        if(bgImage){
            bgImage.destroy()
            var background = group.findOne(".background");
            if(background){
                background.opacity(1);
                background.listening(true);
            }
        }
        $("#widget-bg2").fadeOut(100);
        layer.draw();
        updateLayerButton();
    });
$('#draw-color').on('click', saveState)
$('#border-color').on('click', saveState)
$("#open-layers-btn").click(function () {
    if ($(this).hasClass('active')) {
        $("#widget-layers").fadeOut(100);
        $(this).removeClass('active');
    } else {
        $("#widget-layers").fadeIn(100);
        var container = $(this)
        var widgetLayers = $('#widget-layers');

        var containerOffset = container.offset();

        widgetLayers.css({
            position: 'absolute',
            top: containerOffset.top + 10,
            left: containerOffset.left - $('#widget-layers').width() + 10,
        });
        $(this).addClass('active')
    }
})

$('#border-color').on('input',
    function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        cor = $('#draw-color').val();
        var shape = transformer.nodes()[0];

        if (shape.stroke() != null) {
            shape.stroke($(this).val())
        } else {
            shape.stroke(null)
        }

        layer.draw();
        const colorButton = document.getElementById("border-color-button");

        colorButton.style.backgroundColor = this.value;
    });


$("#btn-text-edit").click(function () {
    $("#widget-text-edit").fadeIn(100);
    var position = $("#draggable").offset();
    var widget = document.getElementById('widget-text-edit');
    var positionTop = position.top;
    var positionLeft = position.left + ($("#draggable").width() / 2 - (widget.offsetWidth / 2));


    widget.style.position = 'fixed';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';

})

function updateHandles(line) {
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");

    stage.find('.handle').forEach((node) => {
        node.destroy()
    })
    // Adiciona handles em cada ponto da linha
    const points = line.points();
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        
        const handle = new Konva.Circle({
            x:x+line.x(),
            y:y+line.y(),
            radius: 8,
            fill: 'white',
            draggable: true,
            stroke:"blue",
            strokeWidth:1,
            name: 'handle',
            attachedTo:line.id(),
            scaleX:1,
            scaleY:1,
        });

        handle.on('dragmove', () => {
            points[i] = handle.x()-line.x();
            points[i + 1] = handle.y()-line.y();
            line.points(points); // Atualiza a linha
            layer.batchDraw();
            createPreciseBorder(line);
        });
        handle.on('dragend', () => {
            updateLayerButton();
        })
        handle.on('mousedown touchstart',(e)=>{
            saveState();
            $(".editor").css("cursor", "url('images/hand2.cur'), auto")
        })
        handle.on('mouseover',(e)=>{

            $(".editor").css("cursor", "url('images/hand1.cur'), auto")
        })
        handle.on('mouseup', (e) => {
            $(".editor").css("cursor", "url('images/hand1.cur'), auto")
        })
        handle.on('mouseout', (e) => {
            $(".editor").css("cursor", "")
        })
        
       group.add(handle);
       handle.scale({
        x: 1 / group.getAbsoluteScale().x, // Inverte a escala do parent
        y: 1 / group.getAbsoluteScale().y,
    });
    }

    // Adiciona um botão no final da linha para expandi-la
    const addHandle = new Konva.Circle({
        x: points[points.length - 2] +line.x(),
        y: points[points.length - 1]+line.y(),
        radius: 12,
        fill: 'white',
        stroke:"green",
        strokeWidth:1,
        draggable: false,
        attachedTo:line.id(),
        name: 'handle',
    });

    // Clique no botão para adicionar novos pontos
    addHandle.on('click tap', () => {
        saveState();
        const newX = points[points.length - 2] + 50; // Define novas coordenadas
        const newY = points[points.length - 1] + 50;
        points.push(newX, newY); // Adiciona novo ponto
        line.points(points); // Atualiza a linha
        attachTransformer(line);
        layer.batchDraw();
        updateLayerButton();
    });
    addHandle.on('mouseover',(e)=>{
        $(".editor").css("cursor", "url('images/hand3.cur'), auto")
    })

    addHandle.on('mouseout',(e)=>{
        $(".editor").css("cursor", "")
    })
    group.add(addHandle);
    addHandle.scale({
        x: 1 / group.getAbsoluteScale().x, // Inverte a escala do parent
        y: 1 / group.getAbsoluteScale().y,
    });
}

$('#draw-color').on('input',
    function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        cor = $('#draw-color').val();
        var shape = transformer.nodes()[0];

        if (shape.fill() == "rgba(0, 0, 0, 0.0)") {
            shape.fill("rgba(0, 0, 0, 0.0)");
            shape.stroke($(this).val())
        } else {
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
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.RegularPolygon({
        id: i.toString() + 'tri',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        sides: 3,
        stroke: null,
        strokeWidth: 0,
        radius: 200,
        x: stageWidth / 2,
        y: stageHeight / 2,
        name: "draw",
        strokeScaleEnabled: false,
        draggable: true,
    });
    var bg = group.findOne(".background");
    shape.x((bg.x() + bg.width() / 2) - shape.radius() / 2)
    shape.y((bg.y() + bg.height() / 2) - shape.radius() / 2)
    group.add(shape)
    attachTransformer(shape);
    layer.draw();

    generateShapeWidget(shape);
    generateShapeEvents(shape, layer);
    groupTrans.moveToTop();
    updateLayerButton();
})

$("#add-star").on("click", function () {
    saveState();
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
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
        stroke: null,
        strokeWidth: "0",
        strokeScaleEnabled: false,
        draggable: true
    });
    var bg = layer.findOne(".background");
    group.add(shape)
    attachTransformer(shape);
    layer.draw();
    shape.x((bg.x() + bg.width() / 2) - shape.innerRadius() / 2)
    shape.y((bg.y() + bg.height() / 2) - shape.innerRadius() / 2)
    generateShapeWidget(shape);
    generateShapeEvents(shape, layer);
    groupTrans.moveToTop();
    updateLayerButton();
})


$("#add-rect").on('click', function () {
    saveState();
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
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
        stroke: null,
        strokeWidth: 0,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
        strokeScaleEnabled: false
    });
    var bg = layer.findOne(".background");
    shape.x((bg.x() + bg.width() / 2) - shape.width() / 2)
    shape.y((bg.y() + bg.height() / 2) - shape.height() / 2)

    group.add(shape)
    attachTransformer(shape);
    layer.draw();
    generateShapeEvents(shape, layer);
    generateShapeWidget(shape);
    updateLayerButton();
})

$("#stroke-width").on('input', function () {
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];

    shape.setAttrs({
        strokeWidth: $(this).val()
    });
    layer.draw();
})
$("#border-radius").on('input', function () {
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
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
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
        stroke: null,
        strokeWidth: 0,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
        strokeScaleEnabled: false
    });
    var bg = layer.findOne(".background");
    shape.x((bg.x() + bg.width() / 2) - shape.width() / 2)
    shape.y((bg.y() + bg.height() / 2) - shape.height() / 2)

    group.add(shape)
    attachTransformer(shape);
    layer.draw();
    generateShapeEvents(shape, layer);
    generateShapeWidget(shape);
    updateLayerButton();
})


function adjustShapeBorder(shape) {

    if(transformer.nodes()[0]===shape){
        $("#shape-border").hide();
        return;
    }
    const className = shape.getClassName();
    const textPosition = shape.absolutePosition();
    const position = $(".konvajs-content").offset();
    const toolbox = document.getElementById('shape-border');

    let scaledWidth, scaledHeight;
    var adjustedTop;
    var adjustedLeft;
    if (className === "Circle") {
        const radius = shape.radius();
        const scaleX = shape.getAbsoluteScale().x;
        const scaleY = shape.getAbsoluteScale().y;
        scaledWidth = scaledHeight = radius * 2 * Math.max(scaleX, scaleY);
        adjustedTop = (position.top + (textPosition.y) - (shape.radius() * shape.getAbsoluteScale().y));
        adjustedLeft = (position.left + (textPosition.x) - (shape.radius() * shape.getAbsoluteScale().x));
    } else if (className === "Star") {
        const radius = shape.outerRadius();
        const scaleX = shape.getAbsoluteScale().x;
        const scaleY = shape.getAbsoluteScale().y;
        scaledWidth = scaledHeight = radius * 2 * Math.max(scaleX, scaleY);
        adjustedTop = (position.top + (textPosition.y) - (shape.outerRadius() * shape.getAbsoluteScale().y));
        adjustedLeft = (position.left + (textPosition.x) - (shape.outerRadius() * shape.getAbsoluteScale().x));
    } else if ((className === "Rect") || (className === "Text") || (className === "Image")) {
        // Shape "regular" como Retângulo, Texto, etc.
        scaledWidth = shape.width() * shape.getAbsoluteScale().x;
        scaledHeight = shape.height() * shape.getAbsoluteScale().y;
        adjustedTop = (position.top + (textPosition.y));
        adjustedLeft = (position.left + (textPosition.x));
    } else if (className === "RegularPolygon") {
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
            const x = (points[i] * shape.getAbsoluteScale().x) + (absolutePosition.x);
            const y = (points[i + 1] * shape.getAbsoluteScale().y) + (absolutePosition.y);
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
    $("#shape-border").css("transform-origin", "top left");
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

    var textarea = document.getElementById('shape-border');
    var rotation = shape.rotation();
    var transform1 = '';
    if (rotation) {
        transform1 += 'rotateZ(' + rotation + 'deg)';
    }
    textarea.style.transform = transform1;

}

function generateShapeEvents(shape, layer) {
    shape.on('transformstart', function (e) {
        saveState();
        $("#widget-shape").fadeOut(100);
    })

    shape.on('transformend', function (e) {
        generateShapeWidget(e.target)
        updateLayerButton();
    })


    shape.on('transform', function (e) {
        adjustShapeBorder(e.target);
        const shape = e.target;

        // Define a lógica ao transformar
        if (shape.className === "Rect" || shape.className === "Image") {
          const transform = shape.getTransform();
      
          // Obtendo altura e largura separadamente
          const width = shape.width() * shape.scaleX();
          const height = shape.height() * shape.scaleY();
       
          if (transformer.getActiveAnchor() === "middle-left" || transformer.getActiveAnchor() === "middle-right") {
          
            shape.width(width); // Mantém a largura real
            shape.scaleX(1); // Zera a escala para evitar efeito cumulativo
          } else if (transformer.getActiveAnchor() === "top-center" || transformer.getActiveAnchor() === "bottom-center") {
            // Altera apenas altura
            shape.height(height); // Mantém a altura real
            shape.scaleY(1); // Zera a escala para evitar efeito cumulativo
          } else {
            // Caso padrão: aplica transformação normalmente
            shape.width(width); // Aplica largura ajustada
            shape.height(height); // Aplica altura ajustada
            shape.scaleX(1);
            shape.scaleY(1);
          }

        }
    })

    shape.on('mouseover', (e) => {
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
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

    shape.on('dragmove', (e) => {
        adjustShapeBorder(e.target)
    })

    shape.on('mouseout touchend', (e) => {
        $("#shape-border").hide();
    })

    shape.on('click tap', (e) => {

        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {

                    return;
                }
            }
        }

        generateShapeWidget(e.target)
        attachTransformer(e.target);
    });


    shape.on('dragend', (e) => {
        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {

                    return;
                }
            }
        }
        if(transformer.nodes()[0]===e.target){
            generateShapeWidget(e.target);
        }

    
        updateLayerButton();
    });
    shape.on('mousedown', (e) => {
        attachTransformer(e.target);
        generateShapeWidget(e.target);
    });
    shape.on('dragstart', (e) => {
        if (drawMode || drawingLineMode) {
            e.target.stopDrag();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    e.target.stopDrag();
                    return;
                }
                if (e.evt.touches && e.evt.touches.length === 1) {
                    if(transformer.nodes()[0] != e.target){
                        e.target.stopDrag();
                        return;
                    }
                }
            }
        }

        saveState();

        $("#widget-shape").fadeOut(100);
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

    const adjustedTop = (stagePosition.top + (nodePosition.y));
    const adjustedLeft = (stagePosition.left + (nodePosition.x));

    const className = shape.getClassName();

    if (className === 'Rect') {
        var positionTop = adjustedTop + (((shape.height()) * shape.getAbsoluteScale().y) + widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2) - ((shape.width()) / 2) * shape.getAbsoluteScale().x);
        $("#border-radius").val(shape.cornerRadius());
    } else if (className === 'Circle') {
        var positionTop = adjustedTop + (((shape.radius()) * shape.getAbsoluteScale().y) + widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2));
    } else if (className === 'RegularPolygon') {
        var positionTop = adjustedTop + (((shape.radius()) * shape.getAbsoluteScale().y));
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2));
    } else {
        var positionTop = adjustedTop + (((shape.outerRadius()) * shape.getAbsoluteScale().y) + widget.offsetHeight);
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2) - (((shape.innerRadius() / 2)) / 2) * shape.getAbsoluteScale().x);
    }
    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height() + 4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop + "px";
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
    if (shape.stroke() != null && shape.fill() == "rgba(0, 0, 0, 0.0)") {
        $("#draw-color").val(shape.stroke());
        colorButton.style.backgroundColor = shape.stroke();
        $(".outline-shape").addClass("selected");
    } else {
        $("#draw-color").val(shape.fill());
        $(".outline-shape").removeClass("selected");
        colorButton.style.backgroundColor = shape.fill();
        borderButton.style.backgroundColor = shape.stroke();
    }

    if (shape.stroke() != null) {
        $(".border-shape").addClass('selected');
    } else {
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
    
    
                    restoreState(layers);
                    redoStack.length = 0;
                    undoStack.length = 0;
                    fitStageIntoParentContainer();
                    updateundoRedoBtn();
                    updateLayerButtons();
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

function limitGroupPosition(group){
    var border = stage.findOne(".border");

        
    const target = group; // O objeto sendo arrastado
    const position = target.getAbsolutePosition(); // Posição atual do objeto


    const adjustedWidth = group.width() * group.getAbsoluteScale().x;
    const adjustedHeight = group.height() * group.getAbsoluteScale().y;
    const previewOffset = $("#preview").offset();
    const previewWidth = $("#preview").outerWidth();
    const previewHeight = $("#preview").outerHeight();
    const boundaryLeft = previewOffset.left + 10; // Limite esquerdo
    const boundaryRight = previewOffset.left + previewWidth - 10; // Limite direito
    const boundaryTop = (previewOffset.top+(previewHeight / 2)) ;
    const boundaryBottom = (previewOffset.top+(previewHeight / 2)) ;


    // Define os novos valores
    let newX = position.x;
    let newY = position.y;

    // Restrição para o limite esquerdo
    if (newX > boundaryLeft) {
        newX = boundaryLeft;
    }
    // Restrição para o limite direito
    if (newX + adjustedWidth < boundaryRight) {
        newX = boundaryRight - adjustedWidth;
    }

    // Restrição para o limite superior
    if (newY > boundaryTop) {
        newY = boundaryTop;
    }
    if (newY + adjustedHeight < boundaryBottom) {
        newY = boundaryBottom - adjustedHeight;
    }
    // Define a posição restrita final
    target.setAbsolutePosition({ x: newX, y: newY });
                border.setAttrs({
                    listening: false,
                    x: group.getAbsolutePosition().x - ($("#preview").width() / 2),
                    y: group.getAbsolutePosition().y - ($("#preview").width() / 2),
                    stroke: 'rgba(44, 44, 46, 0.87)',
                    strokeWidth: $("#preview").width(),
                    draggable: false, // Para manter a borda fixa
                    name: 'border'
                })
}
let typingTimer;
let typingTimer2;
const typingDelay = 500;
let countIcon = 20;
let countImage = 20;
function isDivFullyScrolled(div) {
    const element = $(div)[0]; // Pega o DOM element da jQuery

    // Calcula se a div está completamente rolada
    return element.scrollTop + element.clientHeight >= element.scrollHeight;
}

$('#icon-btn-area').on('click', '.item', function (e) {

    addImage($(this).attr("icon"));
});

$('#background-btn-area').on('click', '.item', function (e) {

    addBackground($(this).attr("image"));
});




function addBackground(image){
    saveState();
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
    var bg = group.findOne(".background");
    bg.opacity(0);
    bg.listening(false);
    var backgroundImageGroup = group.findOne(".groupImage");

    if(backgroundImageGroup){
        backgroundImageGroup.destroy();
    }
    const groupImage = new Konva.Group({
        name:"groupImage",
        x:0,
        y:0,
        clip: {
            width: bg.width(), // Largura do clipping
            height: bg.height(), // Altura do clipping
        },
    });
    
    var imageObj = new Image();
    imageObj.src = image;
    imageObj.crossOrigin = "anonymous";
    imageObj.onload = function () {
        const groupWidth = group.width();
        const groupHeight = group.height();
    
        const imageWidth = imageObj.width;
        const imageHeight = imageObj.height;
    
        // Calcular a escala proporcional para o "fit"
        const widthScale = groupWidth / imageWidth;
        const heightScale = groupHeight / imageHeight;
        const scale = Math.max(widthScale, heightScale); // Escolher o menor para ajustar sem cortar
    
        // Calcular a posição centralizada
        const x = groupWidth / 2 - (imageWidth * scale) / 2;
        const y = groupHeight / 2 - (imageHeight * scale) / 2;
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = imageObj.width;
        tempCanvas.height = imageObj.height;

        tempCtx.drawImage(imageObj, 0, 0);
        const imageSrc = tempCanvas.toDataURL();
        var bgImage = new Konva.Image({
            image: imageObj,
            x: x, // Centralizar horizontalmente
            y: y, // Centralizar verticalmente
            width: imageWidth * scale, // Redimensionar proporcionalmente
            height: imageHeight * scale, // Redimensionar proporcionalmente
            draggable: false,
            name:"bgImage",
            imageSrc: imageSrc
        })
        groupImage.add(bgImage);
        generateBackgroundEvents(bgImage);
        group.add(groupImage)
        groupImage.moveToBottom()
        layer.draw();
        updateLayerButton();
    }
    
}

$("#icon-btn-area").on("scroll", function () {
    if (isDivFullyScrolled(this)) {
        countIcon += 10;
        getIcons($("#search-icon").val())
    } 
});

$("#background-btn-area").on("scroll", function () {
    if (isDivFullyScrolled(this)) {
        countImage += 10;
        if(countImage >= 30 ){
            countImage = 30;  
        }
        if($("#search-background").val() != ""){
            getImages($("#search-background").val(), "background-btn-area");
        }else{
            getImages("background", "background-btn-area");
        }

    } 
});

$("#search-icon").on("input", function () {
    clearTimeout(typingTimer);
    const searchTerm = $(this).val();

    typingTimer = setTimeout(function () {
        countIcon = 20;
        getIcons(searchTerm);
    }, typingDelay);
});

$("#search-font").on("input", function () {
    const searchTerm = $(this).val().toLowerCase(); // Obtém o texto digitado em minúsculas
    const filteredFonts = fontFamilies.filter(font => font.toLowerCase().includes(searchTerm)); // Filtra fontes que contêm o termo pesquisado

    
    $("#font-select").html(""); 
    filteredFonts.forEach(font => {
        $("#font-select").append(`
            <span class="font-item" value="${font}" style="font-family: '${font}'; display: block;">
                ${font}
            </span>
        `);
    });
});

$("#search-background").on("input", function () {
    clearTimeout(typingTimer2);
    const searchTerm = $(this).val();

    typingTimer2 = setTimeout(function () {
        countImage = 20;
        getImages(searchTerm, "background-btn-area");
    
    }, 500);
});

function getImages(search = "",containerId){
    const ACCESS_KEY = "RAXU1PptzmyPgMjOUO0MIO4mELSR-bVCNM_QmAqcVsk";
    
    const PROXY_URL = `https://proxy-server-beta-brown.vercel.app/api/proxy?url=${encodeURIComponent(`https://api.unsplash.com/search/photos?query=${search}&per_page=${countImage}&client_id=${ACCESS_KEY}`)}`;
  
    $.ajax({
        url: PROXY_URL,
        method: 'GET',
        success: function (data) {
            $("#"+containerId).html("");
            data.results.forEach((image) => {

                const IconElement = `
                <div class="item" image="${image.urls.full}">
                        <img crossorigin="anonymous" src="${image.urls.thumb}" alt=""></img>
                        <span class="image-autor">Foto por <a href="${image.user.links.html}" target="_blank">${image.user.name}</a> em <a href="https://unsplash.com/" target="_blank">Unsplash</a></span>
                </div>
            `;
                $("#"+containerId).append(IconElement);
            });
        },
        error: function (xhr, status, error) {
            console.error("Erro:", xhr.responseText);
        }
    });
}

function getIcons(search = "") {
    const apiKey = "Fa3z2ALdAgl61tZAXO2JZsCHRBXgv2kGWVfkGby1nJII9uuzFiFITYQagWa5PWYw";  // Sua chave da API Iconfinder
    const url = `https://proxy-server-beta-brown.vercel.app/api/proxy?url=${encodeURIComponent(`https://api.iconfinder.com/v4/icons/search?query=${search}&count=${countIcon}`)}`;

    $.ajax({
        url: url,
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`  // Adiciona o cabeçalho Authorization
        },
        success: function (data) {

            $("#icon-btn-area").html("");  // Limpa o container de ícones
            data.icons.forEach((icon) => {
                const maxSize = icon.raster_sizes[icon.raster_sizes.length - 3];
                const previewUrl = maxSize.formats[0].preview_url;
                
                const IconElement = `
                    <div class="item" icon="${previewUrl}">
                        <img src="${previewUrl}" crossorigin="anonymous" alt="${icon.tags.join(', ')}" />
                    </div>
                `;
                $("#icon-btn-area").append(IconElement);  // Adiciona os ícones ao container
            });
        },
        error: function (xhr) {
            console.error("Erro na API", xhr.responseJSON);  // Exibe erros da API
        }
    });
}



$("#btn-widget-icon").click(function () {
    $("#widget-icon").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#widget-icon").outerWidth();
    const elementHeight = $("#widget-icon").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#widget-icon").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });
    
})


function generateLayerEvents(layer){
    layer.on('dragmove', function (e) {
        // clear all previous lines on the screen
        layer.find('.guid-line').forEach((l) => l.destroy());

        // find possible snapping lines
        var lineGuideStops = getLineGuideStops(e.target);
        // find snapping points of current object
        var itemBounds = getObjectSnappingEdges(e.target);
        // now find where can we snap current object
        var guides = getGuides(lineGuideStops, itemBounds);

        // do nothing of no snapping
        if (!guides.length) {
          return;
        }

        drawGuides(guides);

        var absPos = e.target.absolutePosition();
        // now force object position
        guides.forEach((lg) => {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
        });
        e.target.absolutePosition(absPos);
      });

      layer.on('dragend', function (e) {
        // clear all previous lines on the screen
        layer.find('.guid-line').forEach((l) => l.destroy());
      });

}

$("#model-widget-btn").click(function () {
    $("#add-model-widget").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#add-model-widget").outerWidth();
    const elementHeight = $("#add-model-widget").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#add-model-widget").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });

})

$("#add-circle").on('click', function () {
    saveState();
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#currentLayer").val());
    var group = page.findOne(".grupo");
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var shape = new Konva.Circle({
        id: i.toString() + 'circle',
        fill: Konva.Util.getRandomColor(),
        radius: 100 + Math.random() * 20,
        shadowBlur: 10,
        stroke: null,
        strokeWidth: 0,
        fakeShapeId: 'stage',
        x: stageWidth / 2,
        y: stageHeight / 2,
        name: "draw",
        strokeScaleEnabled: false,
        draggable: true,
    });
    var bg = group.findOne(".background");

    shape.x((bg.x() + bg.width() / 2) - shape.radius() / 2)
    shape.y((bg.y() + bg.height() / 2) - shape.radius() / 2)
    group.add(shape)
    attachTransformer(shape);

    layer.draw();

    generateShapeWidget(shape)
    generateShapeEvents(shape, layer);

    groupTrans.moveToTop();
    updateLayerButton();
})

function cleanStage() {
    const layer = stage.findOne("#layer-main");
    const Groups = Array.from(layer.find('Group'));

    Groups.forEach((page) => {
        page.destroy();
    });

    var newPage = new Konva.Group({
        id: "layer" + getRandomInt(1000),
        name: "Pagina 1",
        pageNumber: 1,
        zIndex: 1,
        width: parseInt(originalStageWidth),
        height: parseInt(originalStageHeight),
    });

    background = new Konva.Rect({

        width: parseInt(originalStageWidth),
        height: parseInt(originalStageHeight),
        id: "background" + getRandomInt(1000),
        name: "background",
        fill: "white",
        x: 0,
        y: 0,
        stroke: 'gray',
        strokeWidth: 2,
    });
    generateBackgroundEvents(background, layer);
    var group = new Konva.Group({
        width: parseInt(originalStageWidth),
        height: parseInt(originalStageHeight),
        name: 'grupo'
    });

    group.add(background);
    var border = new Konva.Rect({
        listening: false,
        x: background.getAbsolutePosition().x - $("#preview").width() / 2,
        y: background.getAbsolutePosition().y - $("#preview").width() / 2,
        width: parseInt(originalStageWidth) + $("#preview").width(),
        height: parseInt(originalStageHeight) + $("#preview").width(),
        stroke: 'rgba(44, 44, 46, 0.87)',
        strokeWidth: $("#preview").width(),
        draggable: false, // Para manter a borda fixa
        name: 'border'
    });
    newPage.add(group);
    group.position({
        x: ($("#preview").width() - parseInt(originalStageWidth)) / 2,
        y: ($("#preview").height() - parseInt(originalStageHeight)) / 2,
    })
    layer.add(newPage);
    layer.add(border);
    $("#currentLayer").val(newPage.id())
    updatePageNumbers();

    stage.draw();
   
}
var transformer;
var stageWidth;
var stageHeight;
var stage;
var tr;
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

        $('#zoom-slider').val(1)
    } else {
        stageWidth = 800;
        stageHeight = 600;

    }

    $("body").height($(window).height());

    $("#project-info").text(stageWidth + " x " + stageHeight)
    originalStageWidth = 800;
    originalStageHeight = 600;
    $(".header").text(title + " - " + stageWidth + "x" + stageHeight)
    stage = new Konva.Stage({
        container: 'container',
        width: $("#preview").width(),
        height: $("#preview").height(),
        id: "stage",

    });

    transformer = addTransformer();

    var layer = new Konva.Layer({
        id: "layer-main",
       
    });





    var page = new Konva.Group({
        id: "layer" + getRandomInt(1000),
        name: "Pagina 1",
        pageNumber: 1,
        zIndex: 1,

    });
    $("#currentLayer").val(page.id());
    var transformerLayer = new Konva.Layer({
        id: "transformerLayer",
        zIndex: 0
    });
    layer.add(page);
    stage.add(layer);
    stage.add(transformerLayer);
    layer.zIndex(1)
    transformerLayer.moveToBottom();

    var group = new Konva.Group({
        width: 800,
        height: 600,
        name: 'grupo',
    });

    var clipRect = { x: ($("#preview").width() - 800) / 2, y: ($("#preview").height() - 600) / 2, width: 800, height: 600 };

    generateLayerEvents(layer);


    var background = new Konva.Rect({
        x: 0,
        y: 0,
        name: "background",
        width: 800,
        height: 600,
        fill: 'white',
        stroke: 'gray',
        strokeWidth: 0,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 3, y: 3 },
        shadowOpacity: 0.5,
        id:"bg-"+Math.random()
    });

    group.add(background);
    group.position({
        x: ($("#preview").width() - 800) / 2,
        y: ($("#preview").height() - 600) / 2,
    })
    background.position({ x: 0, y: 0 })


    layer.draw()
    $('#bgcolor').attr("object-id", background.id());

    page.add(group);

    var border = new Konva.Rect({
        listening: false,
        x: background.getAbsolutePosition().x - $("#preview").width() / 2,
        y: background.getAbsolutePosition().y - $("#preview").width() / 2,
        width: clipRect.width + $("#preview").width(),
        height: clipRect.height + $("#preview").width(),
        stroke: 'rgba(44, 44, 46, 0.87)',
        strokeWidth: $("#preview").width(),
        draggable: false, // Para manter a borda fixa
        name: 'border'
    });
    page.add(border);
    border.moveToTop();
    generateBackgroundEvents(background, layer);
    var isPaint = false;

    var lastLine;



    let isDraggingStage = false; // Indica se o arrasto está ativo
    let dragStartPosition = null; // Posição inicial do arrasto
    let initialGroupPosition = null; // Posição inicial do grupo antes do arrasto
    
    stage.on('touchstart', (e) => {
        var page = stage.findOne("#"+$("#currentLayer").val());
        var group = page.findOne(".grupo");
        if(e.target===stage){
            transformer.nodes([]);
            stage.find('.handle').forEach((node) => {
                node.destroy()
            })
            var border = stage.findOne(".lineBorder");
            if(border){
                border.destroy();
            }
        }
        if (!drawMode && !drawingLineMode) {
            if (e.evt) {
                if (e.evt.type.startsWith('touch')) {
                    // Confirma que é um evento de toque
                    if (e.evt.touches && e.evt.touches.length === 1) {
                        if(!transformer.nodes()[0]){
                            isDraggingStage = true;
                            dragStartPosition = stage.getPointerPosition(); // Captura a posição inicial do cursor
                            initialGroupPosition = group.getAbsolutePosition(); // Captura a posição inicial do grupo
                        }
                    }else if (e.evt.touches && e.evt.touches.length === 2) {
                        isDraggingStage = false;                     
                    }
                }
            }
        }
    });
    
    stage.on('touchmove', (e) => {
        if (isDraggingStage) {
            var page = stage.findOne("#"+$("#currentLayer").val());
            var group = page.findOne(".grupo");
            const pointerPosition = stage.getPointerPosition(); // Captura a posição atual do cursor
    
            // Calcula o deslocamento do cursor
            const dx = pointerPosition.x - dragStartPosition.x;
            const dy = pointerPosition.y - dragStartPosition.y;

    
            if(group.width()*group.getAbsoluteScale().x > $("#preview").outerWidth()){
                group.setAbsolutePosition({
                    x: initialGroupPosition.x + dx,
                    y: initialGroupPosition.y + dy,
                });

                limitGroupPosition(group)
                        
            }
            stage.batchDraw();
        }
    });
    $(window).on("resize",fitStageIntoParentContainer());
    stage.on('touchend', () => {
        isDraggingStage = false; // Finaliza o arrasto
    });





    stage.on('mouseout', function () {
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
        var layer = stage.findOne("#layer-main");
        var page = layer.findOne("#" + $("#currentLayer").val());
        var group = page.findOne(".grupo");
        if (drawMode) {
            var pointerPosition = stage.getPointerPosition();
            if (!pointerPosition) return;
            stage.listening(false);



            var scale = stage.getAbsoluteScale(); // Obter a escala real do grupo
            var position = stage.getAbsolutePosition(); // Obter posição do grupo no canvas

            // Ajustar a posição do pointer para considerar transformações do grupo
            var adjustedPosition = {
                x: (pointerPosition.x - position.x) / scale.x,
                y: (pointerPosition.y - position.y) / scale.y
            };
            var DrawCursorRadius = stage.findOne("#DrawCursorRadius");

            if (!DrawCursorRadius) {
                $("#draw").click();
            }
            DrawCursorRadius.visible(true);
            DrawCursorRadius.x(adjustedPosition.x)
            DrawCursorRadius.y(adjustedPosition.y)
            DrawCursorRadius.radius((size / 2)*group.getAbsoluteScale().x);
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
            if(drawingLineMode){
                $(".editor").css("cursor", "url('images/cross.cur'), auto")
            }else{
                
            }

        }
    })
    var lineId;
    var drawingLine = false;
    stage.on('mousedown touchstart', function (e) {
        var layer = stage.findOne("#layer-main");
        var page = layer.findOne("#" + $("#currentLayer").val());
        var group = page.findOne(".grupo");
        if (drawMode) {
            saveState();
            isPaint = true;
            const pointerPosition = stage.getRelativePointerPosition();
            if (!pointerPosition) return;

            if (!group) return;

            const scale = group.getAbsoluteScale(); // Obter a escala real do grupo
            const position = group.getAbsolutePosition(); // Obter posição do grupo no canvas

            // Ajustar a posição do pointer para considerar transformações do grupo
            const adjustedPosition = {
                x: (pointerPosition.x - position.x) / scale.x,
                y: (pointerPosition.y - position.y) / scale.y
            };

            lastLine = new Konva.Line({
                stroke: color,
                strokeWidth:parseInt(size),
                globalCompositeOperation:
                    mode === 'brush' ? 'source-over' : 'destination-out',
                lineJoin: 'round',
                lineCap: 'round',
                name:"line",
                listening: false,
                id:"line"+Math.random(),
                points: [adjustedPosition.x, adjustedPosition.y, adjustedPosition.x, adjustedPosition.y]
            });
            group.add(lastLine);
            const DrawCursorRadius = stage.findOne("#DrawCursorRadius");
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

        if (drawingLineMode) {
            saveState();

            const pointerPosition = stage.getPointerPosition();
            if (!group) return;

            const scale = group.getAbsoluteScale();
            const position = group.getAbsolutePosition(); 

            const adjustedPosition = {
                x: (pointerPosition.x - position.x) / scale.x,
                y: (pointerPosition.y - position.y) / scale.y
            };
            drawingLine = true;

            const line = new Konva.Line({
                stroke: lineColor,
                name: "line",
                strokeWidth: parseInt(lineSize),
                listening: true,
                id: "line" + Math.random(),
                hitStrokeWidth: 50, 
                draggable: true,
                points: [adjustedPosition.x, adjustedPosition.y, adjustedPosition.x, adjustedPosition.y]
            });
            
            generateLineEvents(line)
            
            lineId = line.id();
            group.add(line);
            page.draw();

        }
    });
    let isHandlingEvent = false;

    stage.on('mouseup touchend', function (e) {
        isPaint = false;
        drawingLine = false;
        lineId = 0;
        if (drawMode || drawingLineMode) {
            updateLayerButton();
        }
    });
    stage.on('mousemove touchmove', function (e) {
        var layer = stage.findOne("#layer-main");
        var page = layer.findOne("#" + $("#currentLayer").val());
        var group = page.findOne(".grupo");
        const pointerPosition = stage.getRelativePointerPosition();
        if (drawMode) {

            if (!pointerPosition) return;

            if (!group) return;

            const scale = group.getAbsoluteScale(); // Obter a escala real do grupo
            const position = group.getAbsolutePosition(); // Obter posição do grupo no canvas

            // Ajustar a posição do pointer para considerar transformações do grupo
            const adjustedPosition = {
                x: (pointerPosition.x - position.x) / scale.x,
                y: (pointerPosition.y - position.y) / scale.y
            };
            const scale2 = stage.getAbsoluteScale(); // Obter a escala real do grupo
            const position2 = stage.getAbsolutePosition(); // Obter posição do grupo no canvas

            // Ajustar a posição do pointer para considerar transformações do grupo
            const adjustedPosition2 = {
                x: (pointerPosition.x - position2.x) / scale2.x,
                y: (pointerPosition.y - position2.y) / scale2.y
            };
            const DrawCursorRadius = stage.findOne("#DrawCursorRadius");

            if (!DrawCursorRadius) {
                $("#draw").click();
                return;
            }

            DrawCursorRadius.x(adjustedPosition2.x)
            DrawCursorRadius.y(adjustedPosition2.y)
            if (!isPaint) {
                return;
            }
       

            const newPoints = lastLine.points().concat([adjustedPosition.x, adjustedPosition.y]);
            lastLine.points(newPoints);


            page.draw();
        }


        if (drawingLine) {
            // Captura a linha com base no ID
            const line = group.findOne("#" + lineId);
            if (!line || !group) {
                return;
            }

            // Escala e posição do grupo
            const scale = group.getAbsoluteScale();
            const position = group.getAbsolutePosition();

            // Calcula a posição ajustada para o mouse
            const adjustedPosition = {
                x: (pointerPosition.x - position.x) / scale.x,
                y: (pointerPosition.y - position.y) / scale.y
            };

            // Atualiza os pontos sem sobrescrever excessivamente
            const points = line.points();
            if (points.length < 4) {
                points.push(adjustedPosition.x, adjustedPosition.y);
            } else {
                points[points.length - 2] = adjustedPosition.x;
                points[points.length - 1] = adjustedPosition.y;
            }

            // Verificação dos pontos
            if (!points.every(val => typeof val === 'number' && !isNaN(val))) {
                console.error("Invalid points detected:", points);
                return;
            }

            line.points(points); // Atualiza os pontos na linha
            attachTransformer(line);
            // Força um desenho seguro da camada
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

        if ((e.target.name() != 'image') && (e.target.name() != 'button-up') && (e.target.name() != 'draw') && (e.target.name() != 'button-down') && ((e.target.name() != 'text')) && (e.target.name() != 'button-edit') && (e.target.name() != 'button-copy') && (e.target.name() != 'line')&& (e.target.name() != 'handle')) {

            if (drawMode || drawingLineMode) {
                return;
            }

            $("#draggable").fadeOut(100);
            $("#widget-shape").fadeOut(100);
            $("#widget-fonts").fadeOut(100);
            $("#widget-image").fadeOut(100);
            $("#widget-figures").fadeOut(100);
            $("#widget-draw-line").fadeOut(100);
            transformer.nodes([]);
            stage.find('.handle').forEach((node) => {
                node.destroy()
            })
            var border = stage.findOne(".lineBorder");
            if(border){
                border.destroy();
            }
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
        if ((e.target.name() === 'image') || (e.target.name() === 'text') || (e.target.name() === 'background') || (e.target.name() === 'draw')|| (e.target.name() === 'line')) {
            if (drawMode || drawingLineMode) {
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
            }
            if ((e.target.name() != 'background') || (drawMode)) {
                $("#widget-bg").fadeOut(100);
                $("#widget-figures").fadeOut(100);
            }
            if (e.target.name() != 'draw') {
                $("#widget-bg").fadeOut(100);
                $("#widget-shape").fadeOut(100);
                $("#widget-figures").fadeOut(100);

            }
            if (e.target.name() != 'image') {
                $("#widget-image").fadeOut(100);
                $("#widget-figures").fadeOut(100);
    
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
    layer.add(page);
    layer.draw();

    $(".layers-header").width(243);
    
    fitStageIntoParentContainer();
    updateLayerButtons()
    stage.draw();

});

function calculateLineBoundingBox(line) {
    const points = line.points(); // Pontos locais da linha
    const strokeWidth = line.strokeWidth() || 0;

    // Inicializa limites com os valores dos primeiros pontos
    let minX = points[0];
    let minY = points[1];
    let maxX = points[0];
    let maxY = points[1];

    // Itera pelos pontos (x, y)
    for (let i = 2; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    // Expande pelos valores de strokeWidth
    const halfStrokeWidth = strokeWidth / 2;
    return {
        x: minX - halfStrokeWidth,
        y: minY - halfStrokeWidth,
        width: (maxX - minX) + strokeWidth,
        height: (maxY - minY) + strokeWidth,
    };
}
function createPreciseBorder(line) {
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#"+$("#currentLayer").val())
    var group  = page.findOne(".grupo");
    var border1 = stage.findOne(".lineBorder");
    if(border1){
        border1.destroy();
    }
    const points = line.points(); // Obtém os pontos da linha
    const strokeWidth = line.strokeWidth() || 0;

    const offset = strokeWidth / 2; // Deslocamento para os dois lados
    const pathPoints = [];

    // Calcula as normais para cada segmento da linha
    for (let i = 0; i < points.length - 2; i += 2) {
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];

        // Vetor direção do segmento
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Comprimento do vetor
        const length = Math.sqrt(dx * dx + dy * dy);

        // Vetor normal perpendicular
        const normalX = (-(dy / length) * offset);
        const normalY = ((dx / length) * offset);

        // Adiciona pontos deslocados para cima e para baixo
        pathPoints.push(x1 + normalX, y1 + normalY); // Lado superior
        pathPoints.push(x1 - normalX, y1 - normalY); // Lado inferior
    }

    // Fechar o caminho nos extremos
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    pathPoints.push(lastX + offset, lastY + offset);
    pathPoints.push(lastX - offset, lastY - offset);

    // Cria um Shape de contorno baseado no Path
    const border = new Konva.Line({
        points: pathPoints,
        name:"lineBorder",
        x: line.x(),
        y:line.y(),
        stroke: '#FFD843',
        strokeWidth: 2,
        closed: true, // Fecha o contorno
        listening: false, // Não capturar eventos
    });
    group.add(border);
    border.moveToTop();
    layer.batchDraw();
}

function generateLineEvents(line, layer) {

    line.on("click tap", function (e) {
        if (drawMode || drawingLineMode) {
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    return;
                }
            }
        }
        createPreciseBorder(e.target);
        generateLineWidget(e.target);
        attachTransformer(e.target);
    })
    line.on("mousedown", function (e) {
        if (drawMode || drawingLineMode) {
            return;
        }
        generateLineWidget(e.target);
        attachTransformer(e.target);
    })
    line.on('dragstart', function(e){
        if (drawMode || drawingLineMode) {
            e.target.stopDrag();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    var border = stage.findOne(".lineBorder");
                    if(border){
                        border.destroy();
                    }
                    return;
                }
                if (e.evt.touches && e.evt.touches.length === 1) {
                    var handle = stage.findOne('.handle')
        
                    if(handle){
                        var line = stage.findOne("#"+handle.getAttr('attachedTo'));
                        if (line != e.target) {
                            e.target.stopDrag();   
                        }    
                    }                    
                    return;
                }
            }
        }
        saveState();

    })

    line.on('touchstart', function(e){
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }

            }
        }
        
    })

    line.on('mouseover', function (e) {
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    $("#shape-border").hide();
                    return;
                }
            }
        }

        createPreciseBorder(e.target)
    })

    line.on('mouseout', function (e) {
        var border = stage.findOne(".lineBorder");
        if(border){
            border.destroy();
        }
        $("#shape-border").hide();
    })

    line.on("dragmove", function (e) {
        if (drawMode || drawingLineMode) {
            e.target.stopDrag();
            return;
        }

        if (e.evt) {
            if (e.evt.type.startsWith('touch')) {
                // Confirma que é um evento de toque
                if (e.evt.touches && e.evt.touches.length === 2) {
                    var border = stage.findOne(".lineBorder");
                    if(border){
                        border.destroy();
                    }
                    return;
                }
                if (e.evt.touches && e.evt.touches.length === 1) {
                    var handle = stage.findOne('.handle')
        
                    if(handle){
                        var line = stage.findOne("#"+handle.getAttr('attachedTo'));
                        if (line != e.target) {
                            e.target.stopDrag();
                            return;
                        }    
                    }else{
                        e.target.stopDrag();
                        return;
                    }                    
                }
            }
        }
        attachTransformer(e.target);
        var border = stage.findOne(".lineBorder");
        if(border){
            border.x(e.target.x());
            border.y(e.target.y());
        }
    })

    line.on('transformend dragend', function(e){
        updateLayerButton();
        if(transformer.nodes()[0]=== e.target){
            generateLineWidget(e.target);
        }
    })

}


function generateLineWidget(line) {
    $("#widget-draw-line").fadeIn(100);

    var position = $(".konvajs-content").offset();
    var widget = document.getElementById('widget-draw-line');
    var positionLeft = position.left + ($(".konvajs-content").width() / 2 - (widget.offsetWidth));

    if ($(window).outerWidth() < 450) {
        var position = $(".editor-panel").offset();
        var positionTop = position.top - ($(".editor-panel").height() + 4);
        widget.style.position = 'absolute';
        widget.style.top = positionTop + "px";
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

    background.on("click dbltap", function (e) {
        if (!drawMode && !drawingLineMode) {
            if(background.getClassName()=="Image"){
                $("#widget-bg2").fadeIn(100);
                var position = $(".preview-img").offset();
                var widget = document.getElementById('widget-bg2');
                var positionTop = position.top + $(".preview-img").height() - 40;
                var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    
                if ($(window).outerWidth() < 450) {
                    var position = $(".editor-panel").offset();
                    var positionTop = position.top - ($(".editor-panel").height() + 4);
                    widget.style.position = 'absolute';
                    widget.style.top = positionTop + "px";
                    widget.style.left = '0px';
                    widget.style.width = "100%";
                } else {
                    widget.style.position = 'absolute';
                    widget.style.top = '50px';
                    widget.style.left = positionLeft + 'px';
                }
    
            }else
            {
                $("#widget-bg").fadeIn(100);
                var position = $(".preview-img").offset();
                var widget = document.getElementById('widget-bg');
                var positionTop = position.top + $(".preview-img").height() - 40;
                var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    
                if ($(window).outerWidth() < 450) {
                    var position = $(".editor-panel").offset();
                    var positionTop = position.top - ($(".editor-panel").height() + 4);
                    widget.style.position = 'absolute';
                    widget.style.top = positionTop + "px";
                    widget.style.left = '0px';
                    widget.style.width = "100%";
                } else {
                    widget.style.position = 'absolute';
                    widget.style.top = '50px';
                    widget.style.left = positionLeft + 'px';
                }
    
            }

        }
    });

    background.on('mouseover', function (e) {
        if (drawMode || drawingLineMode) {
            $("#shape-border").hide();
            return;
        }

        if (e.evt) {
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

    

    background.on('mouseout touchend', function (e) {
        $("#shape-border").hide();
    })


    background.on('mousedown touchstart', function (e) {
        transformer.nodes([]);
        stage.find('.handle').forEach((node) => {
            node.destroy()
        })
    })


}

function fitStageIntoParentContainer() {
    var layer = stage.findOne("#layer-main");
    var groups = Array.from(layer.find('Group'));
    var pages = groups.filter(group => group.name() !== 'grupo' && group.name() !== 'groupImage' );

    const stageParent = document.getElementById('preview'); // Container principal do stage

    // Dimensões do container pai (área visível no browser)
    const stageWidth = stageParent.offsetWidth;
    const stageHeight = stageParent.offsetHeight;
    var scaleX = stageWidth / originalStageWidth;
    var scaleY = stageHeight / originalStageHeight;
    var scale = Math.min(scaleX, scaleY); // Escolhe o menor fator para manter a proporção
    if ($(window).outerWidth() < 820) {
        scaleX = stageWidth / originalStageWidth;
        scaleY = stageHeight / originalStageHeight;

    }else{
        scaleX = (stageWidth * 0.8)  / originalStageWidth;
        scaleY = (stageHeight* 0.8)  / originalStageHeight;
        
    }
    var scale = Math.min(scaleX, scaleY); // Escolhe o menor fator para manter a proporção

    pages.forEach((page, index) => {

        const group = page.findOne(".grupo");
        page.width(originalStageWidth);
        page.height(originalStageHeight);

        group.scale({ x: scale, y: scale });
        $('#zoom-slider').val(scale);
        zoom = scale;
        group.width((originalStageWidth));
        group.height((originalStageHeight))
        group.position({
            x: (stageWidth - originalStageWidth * group.getAbsoluteScale().x) / 2, // Centraliza horizontalmente
            y: (stageHeight - originalStageHeight * group.getAbsoluteScale().y) / 2, // Centraliza verticalmente
        });

    
        const border = page.findOne(".border");

        if(border){
            border.setAttrs({
                listening: false,
                x: group.getAbsolutePosition().x - ($("#preview").width() / 2),
                y: group.getAbsolutePosition().y - ($("#preview").width() / 2),
                width: (originalStageWidth * scale) + $("#preview").width(),
                height: (originalStageHeight * scale) + $("#preview").width(),
                stroke: 'rgba(44, 44, 46, 0.87)',
                strokeWidth: $("#preview").width(),
                draggable: false, // Para manter a borda fixa
                name: 'border'
            })
        
        }

    })
    
    layer.draw();
    stage.draw();
}

$(function () {
    $(".btn-style").on('click', function () {
        saveState();
        var layer = stage.findOne("#layer-main");
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
        updateLayerButton();
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
        updateLayerButton();
    });

    $(".outline-shape").on('click', function () {
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
        updateLayerButton();
    });

    $(".border-shape").on('click', function () {
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
        updateLayerButton();
    });



    $(".slider-opacity").on('mousedown touchstart', function () {
        saveState();
        updateLayerButton();
    });
    $(".slider-opacity").on('input', function () {
        var layer = stage.findOne("#" + $("#currentLayer").val());
        var text = transformer.nodes()[0];
        if(text){
            text.opacity($(this).val());
        }
        layer.draw();
    });

    $('#font-select').on('click', '.font-item', function (e) {
        saveState();
        var layer = stage.findOne("#layer-main");
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
        updateLayerButton();
    })


    $("#text-font-edit").on('click', function () {
        $("#widget-fonts").css('background-color', 'background: rgba(47, 51, 54, 1)');
        $("#widget-fonts").css('opacity', '1');
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
            widget.style.top = positionTop + "px";
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
        if(text){
            text.text($(this).val());
            stage.findOne("#layer-main").batchDraw();
            var textPosition = text.absolutePosition();
            var position = $(".konvajs-content").offset();
            const adjustedTop = (position.top + (textPosition.y));
            const adjustedLeft = (position.left + textPosition.x);

            $("#input-text-edit").css("font-size", (text.fontSize() * text.getAbsoluteScale().x) + "px");

            $("#input-text-edit").css("padding", (text.padding() * text.getAbsoluteScale().x) + "px");
         
            $("#input-text-edit").css("line-height", text.lineHeight());
            $("#input-text-edit").css("text-align", text.align());
            $("#input-text-edit").css("width", ((text.width() * text.getAbsoluteScale().x) + 'px'));
            $("#input-text-edit").css("height", ((text.height() * text.getAbsoluteScale().y) + 'px'));
            $("#input-text-edit").css("top", adjustedTop);
            $("#input-text-edit").css("left", adjustedLeft);
            $("#edit-text-input").val($(this).val());
        }
        
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
        updateLayerButton();
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

        updateLayerButton();
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
        var positionTop = position.top - ($("#add-text-widget").height() - $(this).height());
        widget.style.position = 'absolute';
        widget.style.top = positionTop + "px";
        widget.style.left = '0px';
        widget.style.bottom = '';
    } else {
        widget.style.position = 'absolute';
        widget.style.top = adjustedTop + "px";
        widget.style.left = adjustedLeft + 'px';
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
        borderStrokeWidth: "2",
        centeredScaling: false,
        ignoreStroke: true,
        enabledAnchors: [
            'bottom-right', 'middle-right', 'middle-left',
            
        ],
        keepRatio: false,
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
        if (drawMode) {
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
            var positionTop = position.top - ($(".editor-panel").height() + 4);
            widget.style.position = 'absolute';
            widget.style.top = positionTop + "px";
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
        $(".editor").css("cursor", "")
        $(this).css('background', "transparent");
        $("#widget-draw-line").fadeOut(100);
        drawingLineMode = false;
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
        if (drawingLineMode) {
            $("#draw-line").click();
        }
        var layer = stage.findOne("#layer-main");
        drawMode = true;
        $("#widget-draw").fadeIn(100);
        if (mode == "brush") {
            $(".draw-mode[draw-mode='brush']").addClass("active");
            $(".draw-mode[draw-mode='eraser']").removeClass("active");
        } else {
            $(".draw-mode[draw-mode='brush']").removeClass("active");
            $(".draw-mode[draw-mode='eraser']").addClass("active");
        }
        var group = layer.findOne("#"+$("#currentLayer").val()).findOne(".grupo");
        const colorButton = document.getElementById("brush-color-button");
        var DrawCursorRadius = new Konva.Circle({
            id: "DrawCursorRadius",
            fill: color,
            radius: (size / 2)* group.getAbsoluteScale().x,
            fakeShapeId: 'stage',
            x: stageWidth / 2,
            y: stageHeight / 2,
            name: "draw",
            stroke: 'black',
            strokeWidth: 0,
            listening: false,
            visible: false
        });
        layer.add(DrawCursorRadius);
        DrawCursorRadius.moveToTop()
        colorButton.style.backgroundColor = color;
        var position = $(".preview-img").offset();
        var widget = document.getElementById('widget-draw');
        var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));

        if ($(window).outerWidth() < 450) {
            var position = $(".editor-panel").offset();
            var positionTop = position.top - ($(".editor-panel").height() + 4);
            widget.style.position = 'absolute';
            widget.style.top = positionTop + "px";
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
        $(".editor").css("cursor", "")
        drawMode = false;
        var DrawCursorRadius = stage.findOne("#DrawCursorRadius");
        if (DrawCursorRadius) {
            DrawCursorRadius.destroy();
        }
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

    var handle = stage.findOne('.handle')

    if(handle){
        var line = stage.findOne("#"+handle.getAttr('attachedTo'));
        if (line instanceof Konva.Line) {
            line.stroke($("#line-color").val());
            line.strokeWidth(parseInt($("#line-size").val()));
        }
    
    }

    $("#line-size-text").text(" " + lineSize + " ");

    colorButton.style.backgroundColor = this.value;
})

function generateGroupEvents(group){
    
    group.on("dragmove", function (e) {
        if(e.target === group){

        }
    });
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function updatePageNumbers() {
    const layer = stage.findOne("#layer-main");
    const layers = Array.from(layer.find('Group'));
    const userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');

    const sortedLayers = userLayers.sort((layer1, layer2) => {
        return layer1.getAttr('pageNumber') - layer2.getAttr("pageNumber");
    });

    sortedLayers.forEach((layer, index) => {
        var number = index + 1;
        layer.setAttrs({
            pageNumber: index + 1,
            name: "Pagina " + number
        });
    });

    stage.batchDraw(); // Redesenha o stage
}

function addPage() {
    saveState();
    const layer = stage.findOne("#layer-main");
    const layers = Array.from(layer.find('Group'));
    const userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
    const newPageNumber = userLayers.length + 1;

    var NewGroup = new Konva.Group({
        width: originalStageWidth,
        height: originalStageHeight,
        name: 'grupo',
    });
    var background = new Konva.Rect({
        x: 0,
        y: 0,
        name: "background",
        width: originalStageWidth,
        height: originalStageHeight,
        fill: 'white',
        stroke: 'gray',
        strokeWidth: 0,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 3, y: 3 },
        shadowOpacity: 0.5,
        id:"bg-"+Math.random()
    });
    generateBackgroundEvents(background);
    NewGroup.add(background);
    NewGroup.position({
        x: ($("#preview").width() - originalStageWidth) / 2,
        y: ($("#preview").height() - originalStageWidth) / 2,
    })

    const newLayer = new Konva.Group({
        id: "layer" + getRandomInt(1000),
        name: "Pagina " + newPageNumber,
        pageNumber: newPageNumber,
        zIndex: userLayers.length,
    });
    $("#currentLayer").val(newLayer.id())

  
    newLayer.add(NewGroup);
    var border = stage.findOne(".border");
    newLayer.add(border);
    layer.add(newLayer);
    updatePageNumbers();
    stage.draw();
    fitStageIntoParentContainer();
    updateLayerButtons();
}

$("#layers").on('click', '#add-layer', function () {
    if (stage.getLayers().length >= 5) {
        return;
    }
    addPage();
});

$("#duplicate-layer").on('click', function () {

    saveState();
    const layer = stage.findOne("#layer-main");
    var page = layer.findOne("#" + $("#selected-page").val())
    const clonedPage = page.clone();

    clonedPage.id("layernew" + getRandomInt(1000));

    layer.add(clonedPage);

    $("#currentLayer").val(clonedPage.id());
    updateLayerButtons();
    updatePageNumbers();
    $("#widget-page").fadeOut(100);
})

$(".btn-delete-layer").on('click', function (e) {

    const layer = stage.findOne("#layer-main");
    const layers = Array.from(layer.find('Group'));
    const userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
    let nextLayerId = userLayers[0].id();
    userLayers.forEach((page) => {
        if (page.id() === $("#selected-page").val() && userLayers.length > 1) {
            saveState();
            const buttonLayer = $('#layers').find(`[layer-id='${page.id()}']`);
            var border = stage.findOne(".border");
            const siblings = buttonLayer.next(".layer");

            if (siblings.length > 0) {

                nextLayerId = buttonLayer.next(".layer").attr("layer-id");
            } else {
                nextLayerId = buttonLayer.prev(".layer").attr("layer-id");

            }
            var nextLayer = layer.findOne("#" + nextLayerId);
            nextLayer.add(border);
            $("#currentLayer").val(nextLayerId);
            page.destroy();
            stage.draw();
            return;
        }
    });
    updatePageNumbers();
    updateLayerButtons();
    $("#widget-page").fadeOut(100);
});

$("#layers").on('click', '.btn-page-options', function (e) {
    e.stopPropagation();
    var layer = $(this).parent()[0];
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


function generateLayerThumbnail(layer) {

    return new Promise((resolve, reject) => {
        const group = layer.findOne(".grupo");
    
        if (!group) {
            console.error("Group not found in layer:", layer);
            reject(new Error("Group not found"));
            return;
        }
    
        const background = group.findOne(".background");
        var clone = group.clone();

        // Temporariamente ajusta a escala para 1
        clone.scale({ x: 0.3, y: 0.3 });
        const canvas = clone.toCanvas({
            x: background.getAbsolutePosition().x,
            y: background.getAbsolutePosition().y,
            width: background.width() * 0.3,
            height: background.height()* 0.3,
        });


        const imageSrc = canvas.toDataURL();
        resolve(imageSrc);
        clone.destroy();

    });
}


function updateLayerButton() {
    var layer = stage.findOne("#layer-main");
    var page = layer.findOne("#"+$("#currentLayer").val())

    var imgPromises = [];

        if ((page.name() !== 'Grupo') && (page.id() !== undefined)) {
            imgPromises.push(
                generateLayerThumbnail(page).then((imgData) => ({
                    imgData,
                    layerId: page.id(),
                }))
            );

        }


    // Atualizar thumbnails no DOM
    Promise.all(imgPromises).then((images) => {


        images.forEach(({ imgData, layerId }) => {
            $(`.layer[layer-id="${layerId}"]`).html(""); // Limpa o container das layers
            const layer1 = stage.findOne("#layer-main");
            const layer = layer1.findOne("#" + layerId);
            if (layer === undefined) {
                return;
            }
            const buttonHtml = `
                <span class="layer-name">${layer.getAttr("pageNumber")}</span>
                <button class="btn-page-options" title="Opções" layer_id="${layerId}"><i
                    class="mdi mdi-dots-vertical" aria-hidden="true"></i></button>
                <img src="${imgData}" class="layer-img" alt="Layer Image" style="">
        `;
        $(`.layer[layer-id="${layerId}"]`).append(buttonHtml);

            const newButton = $("#layers").find(`[layer-id='${layerId}']`);

            if ($("#currentLayer").val() === layerId) {
                newButton.addClass("active");
                const background = layer.findOne(".background");
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


    });
}



function updateLayerButtons() {
    var layer = stage.findOne("#layer-main");
    var layers = Array.from(layer.find('Group'));
    var userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
    var sortedLayers = userLayers.sort((layer1, layer2) => {
        return layer1.getAttr('pageNumber') - layer2.getAttr("pageNumber");
    });
    
    var imgPromises = [];
    sortedLayers.forEach((layer2) => {
        if ((layer2.name() !== 'grupo') && (layer2.id() !== undefined)) {
            imgPromises.push(
                generateLayerThumbnail(layer2).then((imgData) => ({
                    imgData,
                    layerId: layer2.id(),
                }))
            );

        }
    });

    // Atualizar thumbnails no DOM
    Promise.all(imgPromises).then((images) => {
        $("#layers").html(""); // Limpa o container das layers

        images.forEach(({ imgData, layerId }) => {
            const layer1 = stage.findOne("#layer-main");
            const layer = layer1.findOne("#" + layerId);
            if (layer === undefined) {
                return;
            }
            const buttonHtml = `
            <li class="layer" layer-id="${layerId}">
                <span class="layer-name">${layer.getAttr("pageNumber")}</span>
                <button class="btn-page-options" title="Opções" layer_id="${layerId}"><i
                    class="mdi mdi-dots-vertical" aria-hidden="true"></i></button>
                <img src="${imgData}" class="layer-img" alt="Layer Image" style="">
            </li>
        `;
            $("#layers").append(buttonHtml);

            const newButton = $("#layers").find(`[layer-id='${layerId}']`);

            if ($("#currentLayer").val() === layerId) {
                newButton.addClass("active");
                const background = layer.findOne(".background");
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

        // Botão para adicionar nova camada
        $("#layers").append(
            `<button class="btn-add-layer" title="Adicionar nova camada" id="add-layer">
            <i class="mdi mdi-plus" aria-hidden="true"></i>
         </button>`
        );
    });
    // <button class="btn btn-right btn-manage-layer btn-secondary" title="Duplicar camada"
    // id="duplicate-layer"><i class="mdi mdi-layers-triple" aria-hidden="true"></i></button>
    
    setActiveLayer($("#currentLayer").val());
    var transformerLayer = stage.findOne("#transformerLayer");
    transformerLayer.moveToTop();
    stage.draw();
}
function setActiveLayer(selectedLayerId) {
    const layer = stage.findOne("#layer-main");
    const layers = Array.from(layer.find('Group'));
    const userLayers = layers.filter(layer => layer.name() !== 'grupo' &&  layer.name() !== 'groupImage');
    userLayers.forEach((layer) => {
        if (layer.id() === selectedLayerId) {
            layer.visible(true);
            var border = stage.findOne(".border");
            if (border) {
                layer.add(border);
            }

        } else {
            layer.visible(false)
        }
    });
    $("#zoom-slider").trigger("input");
}

$('#layers').on('click', '.layer', function (e) {

    if ($(e.target).is('.check-visible')) {
        return;
    }

    var layer_id = $(this).attr("layer-id");
    $("#currentLayer").val(layer_id)
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
    updateLayerButton();
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
    var handle = stage.findOne('.handle')

    if(handle){
        var line = stage.findOne("#"+handle.getAttr('attachedTo'));
        if (line instanceof Konva.Line) {
            deleteShape(line, layer);
            handle.destroy();
            var border = stage.findOne(".lineBorder");
            if(border){
                border.destroy();
            }
        }
    
    }
    deleteShape(shape, layer);
    updateLayerButton();
})

function deleteShape(shape, layer) {
    if(shape){
        shape.destroy();

        stage.fire('click');
        layer.draw();
    }
}

function copyShape(shape, layer) {
    i++;
    if (shape.name() === "image") {
        var ShapeClone = shape.clone({
            id: 'imagecopy' + i.toString(),
            y: shape.position().y - 40,
            name: shape.name(),
        });
        ShapeClone.cache();
    } else {
        var ShapeClone = shape.clone({
            id: i.toString() + "copy",
            y: shape.position().y - 40,
            name: shape.name(),
        });
    }

    var group = layer.findOne(".grupo");
    group.add(ShapeClone)
    groupTrans.moveToTop();
    attachTransformer(ShapeClone);
    ShapeClone.zIndex(shape.zIndex() + 1);
    ShapeClone.fire("click");
    layer.draw();
}

$(".btn-copy").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];
    copyShape(shape, layer);
    updateLayerButton();
});
$(".moveUp").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];


    // if (textGroup) {
    //     shape = textGroup[0];
    // }

    shape.moveUp();
    groupTrans.moveToTop();
    layer.draw();
    updateLayerButton();
});
$(".moveDown").click(function () {
    saveState();
    var layer = stage.findOne("#" + $("#currentLayer").val());
    var shape = transformer.nodes()[0];


    // if (textGroup) {
    //     shape = textGroup[0];
    // }

    shape.moveDown();
    groupTrans.moveToTop();
    layer.draw();
    updateLayerButton();
});
$('#zoom-slider').on('mouseup touchend', function () {
    updateLayerButton();

});

$('#zoom-slider').on('input', function () {
    const layer1 = stage.findOne("#layer-main");
    const layer = layer1.findOne("#" + $("#currentLayer").val());
    var group = layer.findOne('.grupo');
    // Obtém a escala atual do grupo
    let currentScale = group.getAbsoluteScale().x; // Presume escala uniforme
    const stageCenter = {
        x: (stage.width() * stage.getAbsoluteScale().x) / 2,
        y: (stage.height()* stage.getAbsoluteScale().y)  / 2,
    };

    // Ajusta o nível de zoom
    const absoluteCenter = {
        x: (stageCenter.x - group.getAbsolutePosition().x) / currentScale,
        y: (stageCenter.y - group.getAbsolutePosition().y) / currentScale,
    };

    const newScale = $(this).val();
    const clampedScale = Math.max(newScale, 0.1); // Limita o zoom mínimo a 0.1
    var newPosition;
    // Aplica o novo zoom
    group.scale({ x: clampedScale, y: clampedScale });
    var border = stage.findOne(".border");
    if(group.width()*group.getAbsoluteScale().x < $("#preview").outerWidth()){
        newPosition = {
            x: stageCenter.x - group.width()/2 * clampedScale,
            y: stageCenter.y - group.height()/2 * clampedScale,
        };
    
    
    }else{
        newPosition = {
            x: stageCenter.x - absoluteCenter.x * clampedScale,
            y: stageCenter.y - absoluteCenter.y * clampedScale,
        };
      
    }
    // Ajusta a posição para centralizar no stage

    var border = layer.findOne(".border")
    group.position(newPosition);

    border.setAttrs({
        listening: false,
        x: group.getAbsolutePosition().x - ($("#preview").width() / 2),
        y: group.getAbsolutePosition().y - ($("#preview").width() / 2),
        width: (originalStageWidth * clampedScale) + $("#preview").width(),
        height: (originalStageHeight * clampedScale) + $("#preview").width(),
        stroke: 'rgba(44, 44, 46, 0.87)',
        strokeWidth: $("#preview").width(),
        draggable: false, // Para manter a borda fixa
        name: 'border'
    })
    if(group.width()*group.getAbsoluteScale().x > $("#preview").outerWidth()){
        limitGroupPosition(group);
    }

    group.getLayer().batchDraw();

});

$("#btn-widget-figures").click(function () {
    $("#widget-figures").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#widget-figures").outerWidth();
    const elementHeight = $("#widget-figures").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#widget-figures").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });
})

$("#btn-widget-background").click(function () {
    $("#widget-background").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#widget-background").outerWidth();
    const elementHeight = $("#widget-background").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#widget-background").css({
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
    });
})



$('#reset-zoom').on('click', function () {

    if ($(window).outerWidth() < 450) {

        $("#zoom-slider").val(1);
    } else {

        $("#zoom-slider").val(0.8);
    }

});
$("#download").click(function () {
    var transformerLayer = stage.findOne("#transformerLayer");
    transformerLayer.remove()
    saveClippedArea();
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

    title = $("#input-title").val();
    originalStageWidth = userWidth;
    originalStageHeight = userHeight;

    $("#project-title").text(title)
    $("#project-info").text(userWidth + " x " + userHeight)
    fitStageIntoParentContainer();
    stage.batchDraw();

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
    title = $("#input-title").val();
    originalStageWidth = userWidth;
    originalStageHeight = userHeight;

    cleanStage();
    $("#project-title").text(title)
    $("#project-info").text(userWidth + " x " + userHeight)
    fitStageIntoParentContainer();
    updateLayerButtons();
    transformer.moveToTop();
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
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calcular distância atual entre os dedos
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        e.preventDefault();

        var layer = stage.findOne("#" + $("#currentLayer").val());
        var group = layer.findOne(".grupo");

        // Calcula o centro dos dois toques
        const touchCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };

        // Obtem escala atual e distância entre os toques
        let currentScale = group.scaleX();
        const distanceChange = Math.abs(currentDistance - initialDistance);

        let newScale = currentScale;
        if (distanceChange > 3) {
            newScale += (currentDistance > initialDistance ? 0.01 : -0.01);
            initialDistance = currentDistance;
        }
        const stageCenter = {
            x: stage.width() / 2,
            y: stage.height() / 2,
        };
        const clampedScale = Math.max(0.1, Math.min(newScale, 5)); // Limita o zoom

        const absoluteCenter = {
            x: (stageCenter.x - group.getAbsolutePosition().x) / currentScale,
            y: (stageCenter.y - group.getAbsolutePosition().y) / currentScale,
        };
        // Transforma o centro dos dois toques para coordenadas relativas ao grupo
        const relativeTouchCenter = {
            x: (touchCenter.x - group.getAbsolutePosition().x) / currentScale,
            y: (touchCenter.y - group.getAbsolutePosition().y) / currentScale,
        };

        // Atualiza escala e reposiciona grupo
        group.scale({ x: clampedScale, y: clampedScale });

        if(group.width()*group.getAbsoluteScale().x < $("#preview").outerWidth()){
            group.position({
                x: stageCenter.x - group.width()/2 * clampedScale,
                y: stageCenter.y - group.height()/2 * clampedScale,
            });       
        }else{
            group.position({
                x: stageCenter.x - absoluteCenter.x * clampedScale,
                y: stageCenter.y - absoluteCenter.y * clampedScale,
            });
          
        }
    
        // Atualiza borda de limite e outras propriedades
        const border = stage.findOne(".border");
        border.setAttrs({
            listening: false,
            x: group.getAbsolutePosition().x - $("#preview").width() / 2,
            y: group.getAbsolutePosition().y - $("#preview").width() / 2,
            width: originalStageWidth * clampedScale + $("#preview").width(),
            height: originalStageHeight * clampedScale + $("#preview").width(),
            stroke: 'rgba(44, 44, 46, 0.87)',
            strokeWidth: $("#preview").width(),
            draggable: false,
            name: 'border',
        });

        // Atualiza zoom slider
        $("#zoom-slider").val(clampedScale);


        group.getLayer().batchDraw();
    }
});


detectElement.addEventListener("touchend", function (e) {
    if (e.touches.length < 2) {
        initialDistance = null; // Resetar quando um dedo é retirado
    }
});


detectElement.addEventListener("wheel", function (e) {
    if (!e.ctrlKey) return; // Só permite zoom ao segurar Ctrl

    e.preventDefault(); // Evita o comportamento padrão de rolagem
    const layer1 = stage.findOne("#layer-main");
    const layer = layer1.findOne("#" + $("#currentLayer").val());
    var group = layer.findOne('.grupo');
    // Obtém a escala atual do grupo
    let currentScale = group.getAbsoluteScale().x; // Presume escala uniforme
    const stageCenter = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    const absoluteCenter = {
        x: (stageCenter.x - group.getAbsolutePosition().x) / currentScale,
        y: (stageCenter.y - group.getAbsolutePosition().y) / currentScale,
    };
    // Ajusta o nível de zoom
    const newScale = e.deltaY > 0 ? currentScale - 0.1 : currentScale + 0.1;
    const clampedScale = Math.max(newScale, 0.1); // Limita o zoom mínimo a 0.1

    // Obtém a posição absoluta antes do ajuste
    const absolutePositionBeforeZoom = group.getAbsolutePosition();

    // Aplica o novo zoom
    group.scale({ x: clampedScale, y: clampedScale });
    var border = stage.findOne(".border");
    var newPosition;
    // Ajusta a posição para centralizar no stage
    if(group.width()*group.getAbsoluteScale().x < $("#preview").outerWidth()){
        newPosition = {
            x: stageCenter.x - group.width()/2 * clampedScale,
            y: stageCenter.y - group.height()/2 * clampedScale,
        };
    
    
    }else{
        newPosition = {
            x: stageCenter.x - absoluteCenter.x * clampedScale,
            y: stageCenter.y - absoluteCenter.y * clampedScale,
        };
      
    }



    group.position(newPosition);

    border.setAttrs({
        listening: false,
        x: group.getAbsolutePosition().x - ($("#preview").width() / 2),
        y: group.getAbsolutePosition().y - ($("#preview").width() / 2),
        width: (originalStageWidth * clampedScale) + $("#preview").width(),
        height: (originalStageHeight * clampedScale) + $("#preview").width(),
        stroke: 'rgba(44, 44, 46, 0.87)',
        strokeWidth: $("#preview").width(),
        draggable: false, // Para manter a borda fixa
        name: 'border'
    })

    // Atualiza o slider de zoom (se necessário)
    $("#zoom-slider").val(clampedScale);
    if(group.width()*group.getAbsoluteScale().x > $("#preview").outerWidth()){
        limitGroupPosition(group);
    }
    // Atualiza a camada para aplicar as mudanças
    group.getLayer().batchDraw();
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
        var group = layer.findOne(".grupo");
        const promise = new Promise((resolve) => {
            group.toImage({
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
            saveAs(content, title + ".zip"); // Salva o ZIP com o nome 'modelo.zip'
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
                stage.find('.handle').forEach((node) => {
                    node.destroy()
                })
                var border = stage.findOne(".lineBorder");
                if(border){
                    border.destroy();
                }
            }

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