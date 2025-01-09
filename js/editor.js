let isMousePressed = false;
const alignments = ["left", "center", "right", "justify"];
let currentIndex = 0; 
const icons = ["fa-align-left", "fa-align-center", "fa-align-right", "fa-align-justify"];
const alignmentIcons = {
    left: "fa-align-left",
    center: "fa-align-center",
    right: "fa-align-right",
    justify: "fa-align-justify"
  };
const zoomElement = document.querySelector(".zoom");
let zoom = 1;
const ZOOM_SPEED = 0.1;
let title = "Sem Título";

$(document).on('mousedown touchstart', function () {
    isMousePressed = true;
});


$(document).on('mouseup touchend', function () {
    isMousePressed = false;
});
$(document).ready(function () {
    $(".close").on('click', function (e) {
        $(this).closest(".widget").hide();
        $(this).closest(".widget-fixed").hide();
        var parent = $(this).parent();
        if(parent.hasClass("widget-fixed")){
            drawMode = false;
        }
    }); 

    var container = $('.container2');
    var widgetLayers = $('#widget-layers');

    var containerOffset = container.offset();

    widgetLayers.css({
        position: 'absolute',
        top: containerOffset.top,
        left:containerOffset.left + (container.outerWidth() - widgetLayers.width()*2),
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
        axis: 'y',
        start: function(event, ui) {
           
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
                const layerId = $(this).attr('layer-id');
                const layer = stage.findOne(`#${layerId}`); 
                
                if (layer) {
                    layer.zIndex(index);
                }
            });

            updateLayerButtons();
 
            stage.batchDraw();
        }
    });

    $("#models-category").click(function () {
        $("#widget-products").show();
    })
    $("#add-image").click(function () {
        if (drawMode) {
            $("#draw").click();
        }
        $("#input-image").click();
    })

    $("#text-font").on('change', function () {
        $(this).css("font-family", $(this).val());
        $("#input-text").css("font-family", $(this).val());
    })
    $("#input-color-edit").on('input', function () {

        var text = stage.find("#" + $("#input-edit-id").val())[0];

        text.fill($(this).val());
        layer.draw();
        const colorButton = document.getElementById("text-color-button");

        colorButton.style.backgroundColor = this.value; 
    });
    $("#input-text-edit").on('input', function () {
        var text = stage.find("#" + $("#input-edit-id").val())[0];

        text.text($(this).val());
        updatePos();
        layer.draw();
        var textPosition = text.absolutePosition();
        $("#input-text-edit").css("width", (text.width() * text.getAbsoluteScale().x + 'px'));
        $("#input-text-edit").css("height", (text.height() * text.getAbsoluteScale().y + 'px'));

    });
});
var sliders = ['brightness', 'contrast'];
var drawMode = false;
var imagem4;
$('#input-image').on('change', function (e) {
    var posx = $(this).attr("posx");
    var posy = $(this).attr("posy");
    var shape = $(this).attr("idshape");
    var imagens = e.target.files;
    $(imagens).each(function (index, value) {
        addImage(value, posx, posy, shape);
    });
    $(this).val('');
});
var l = 0;
function addImage(image, posx, posy, id) {
    l++

    var imageObj = new Image();
    var layer = stage.findOne("#"+$("#currentLayer").val());
    imageObj.src = URL.createObjectURL(image);
    imageObj.onload = function () {
        var image = new Konva.Image({
            x: parseFloat(posx),
            y: parseFloat(posy),
            image: imageObj,
            name: 'image',
            id: 'image' + l,
            draggable: true,
            fakeShapeId: id

        });

        image.cache();
        image.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
        if (id != 'stage') {
            var fakeShape = stage.find("#" + id)[0];
            var groupImage = new Konva.Group({
                clipFunc: (ctx) => {
                    ctx.save();
                    ctx.translate(fakeShape.x(), fakeShape.y())
                    ctx.rotate(Konva.getAngle(fakeShape.rotation()))
                    ctx.rect(0, 0, fakeShape.width() * fakeShape.scaleX(), fakeShape.height() * fakeShape.scaleY());
                    ctx.restore()
                },
                draggable: true,
                textId: 'image' + l
            })
            var setx = fakeShape.x() + ((fakeShape.width() * fakeShape.scaleX() / 2) - (image.width() / 2));
            var sety = fakeShape.y() + ((fakeShape.height() * fakeShape.scaleY() / 2) - (image.height() / 2));
            image.setAttrs({ x: setx, y: sety, rotation: fakeShape.rotation() })
            fakeShape.listening(false);
            fakeShape.hide();
            var camera = layer.find(nd => {
                return nd.getAttr("camerafakeShapeId") === id;
            });
            camera.hide();
            groupImage.add(image);
            layer.add(groupImage);
        } else {
            image.x((stageWidth / 2) - image.width() / 2);
            image.y((stageHeight / 2) - image.height() / 2);
            var groupImage = new Konva.Group({ textId: 'image' + l });
            groupImage.add(image)
            layer.add(groupImage);
        }






        function getCrop(image, size, clipPosition) {
            const width = size.width;
            const height = size.height;
            const aspectRatio = width / height;

            let newWidth;
            let newHeight;

            const imageRatio = image.width / image.height;

            if (aspectRatio >= imageRatio) {
                newWidth = image.width;
                newHeight = image.width / aspectRatio;
            } else {
                newWidth = image.height * aspectRatio;
                newHeight = image.height;
            }

            let x = 0;
            let y = 0;
            if (clipPosition === 'left-top') {
                x = 0;
                y = 0;
            } else if (clipPosition === 'left-middle') {
                x = 0;
                y = (image.height - newHeight) / 2;
            } else if (clipPosition === 'left-bottom') {
                x = 0;
                y = image.height - newHeight;
            } else if (clipPosition === 'center-top') {
                x = (image.width - newWidth) / 2;
                y = 0;
            } else if (clipPosition === 'center-middle') {
                x = (image.width - newWidth) / 2;
                y = (image.height - newHeight) / 2;
            } else if (clipPosition === 'center-bottom') {
                x = (image.width - newWidth) / 2;
                y = image.height - newHeight;
            } else if (clipPosition === 'right-top') {
                x = image.width - newWidth;
                y = 0;
            } else if (clipPosition === 'right-middle') {
                x = image.width - newWidth;
                y = (image.height - newHeight) / 2;
            } else if (clipPosition === 'right-bottom') {
                x = image.width - newWidth;
                y = image.height - newHeight;
            } else if (clipPosition === 'scale') {
                x = 0;
                y = 0;
                newWidth = width;
                newHeight = height;
            } else {
                console.error(
                    new Error('Unknown clip position property - ' + clipPosition)
                );
            }

            return {
                cropX: x,
                cropY: y,
                cropWidth: newWidth,
                cropHeight: newHeight,
            };
        }

        function applyCrop(pos, image) {
            const img = image;
            img.setAttr('lastCropUsed', pos);
            const crop = getCrop(
                img.image(),
                { width: img.width(), height: img.height() },
                'center-middle'
            );
            img.setAttrs(crop);
            layer.draw();
        }
        var crop1 = "center-middle";
        stage.on('mousedown touchstart', function (e) {
            transformer.centeredScaling(false);
            if (e.target == transformer.findOne('.middle-left')) {

                crop1 = 'right-bottom';

            } else if (e.target == transformer.findOne('.middle-right')) {
                crop1 = 'left-bottom';

            } else if (e.target == transformer.findOne('.bottom-center')) {
                crop1 = 'center-top';

            } else if (e.target == transformer.findOne('.top-center')) {
                crop1 = 'center-bottom';

            } else if (e.target == transformer.findOne('.bottom-right')) {
                transformer.centeredScaling(true);
            }

        });
        image.on('mousedown touchstart', (e) => {
            const parentLayer = e.target.getLayer();

            if (parentLayer.id() !== $("#currentLayer").val()) {
                return;
            }
            transformer.nodes([e.target]);
            $("#widget-image").fadeIn(100);
            
            generateImageWidget(e.target)
            updatePos();
            layer.draw();
        });
        image.on('dragstart transformstart', (e) => {
            const parentLayer = e.target.getLayer();

            if (parentLayer.id() !== $("#currentLayer").val()) {
                return;
            }
            transformer.nodes([e.target]);
            $("#widget-image").fadeOut(100);
            updatePos();
            layer.draw();
        });


        image.on('transformend', (e) => {

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
            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", e.target.id())
                $("#" + attr).val(e.target[attr]())
                const porcentagem = (e.target[attr]() / $("#"+attr).attr("max")) * 100;
                $("." + attr).text(parseInt(porcentagem)+"%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
            $("#widget-image").fadeIn(100);
            
            generateImageWidget(e.target)
            layer.draw();
        });

        image.on('dragend', (e) => {
            const parentLayer = e.target.getLayer();

            if (parentLayer.id() !== $("#currentLayer").val()) {
                return;
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



        image.on('mouseover', function () {


        });
        image.on('transform', (e) => {
            updatePos();
        });



        var background = stage.find(".background")[0];
        if (background) {

            if (background.id() == 1) {


                groupImage.zIndex(background.zIndex() - 1);
                stage.find("Text").moveToTop();
                stage.find("Circle").moveToTop();
            } else {

            }
        }

        updatePos();

        stage.draw();
        $("#modalImagem").modal("hide");
        transformer.nodes([image]);
        sliders.forEach(function (attr) {
            $("#" + attr).attr("object-id", image.id())
            $("#" + attr).prop("disabled", false);
        });
        groupTrans.moveToTop();
        updatePos();
    }
}


$("#widget-bg-btn").click(function () {
    $("#widget-background").hide();
    var editor = $(".preview-img");
    $("#widget-bg2").css("top", editor.position().top + editor.height() / 2 - $("#widget-bg2").height() / 2);
    $("#widget-bg2").css("left", editor.position().left + editor.width() / 2 - $("#widget-bg2").width() / 2);
    $("#widget-bg2").show();

});

$("#vazio").click(function () {
    cleanStage()
    background.setAttrs({
        fill: "#FFFFFF"
    });
    layer.draw();
    $("#widget-image").show();
    $("#widget-bg2").hide();
    $("[name2=Deitado]").next("span").removeClass("active");
    $('[name2="Em pé"]').next("span").removeClass("active");
    $("[name2=Deitado]").next("span").show();
    $('[name2="Em pé"]').next("span").show();
});
function generateImageWidget(image){
    $("#widget-image").fadeIn(100);
            
    var imagePosition = image.absolutePosition();

    var stagePosition = $(".preview-img").offset();
    var widget = document.getElementById('widget-image');
    widget.style.display = 'block';

    const adjustedTop = (stagePosition.top + (imagePosition.y*zoom));
    const adjustedLeft = (stagePosition.left + (imagePosition.x*zoom));

    var positionTop = adjustedTop  + (((image.height()*zoom) *image.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((image.width()*zoom)  / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
    if($(window).outerWidth()< 450){
        widget.style.position = 'fixed';
        widget.style.bottom ='0px';
        widget.style.left = '0px';
        widget.style.width = "100%";  
    }else
    {
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
    }
    $("#widget-figures").fadeOut(100);
}
var v = 0;
function createText(texto, color, posx, posy, font, fontSize, circle, textDecoration, align, fontStyle, scalex, scaley, rotation, width) {
    var layer = stage.findOne("#"+$("#currentLayer").val());
    v++;
    stage.find("Circle").destroy();
    var Textpre = new Konva.Text({
        fontFamily: font,
        text: texto,
        textDecoration: textDecoration,
        width: parseFloat(width),
        fontSize: parseInt(fontSize),
        align: align,
        fontStyle: fontStyle,
        rotation: rotation,
        x: parseFloat(posx),
        y: parseFloat(posy),
        scaleX: parseFloat(scalex),
        scaleY: parseFloat(scaley),
        draggable: true,

        name: 'background-text',
        fakeShapeId: 'stage',
        id: "text" + v,
        fill: color,
    });
    var groupText = new Konva.Group({
        width: width,
        textId: "text" + v,
    })
    Textpre.verticalAlign('middle');
    groupText.add(Textpre);
    if (circle == 1) {
        var circle = new Konva.Circle({
            x: 601.0000000000002,
            y: 2515.655643203652,
            radius: 40,
            fill: color,
            stroke: color,
            name: 'background',
            draggable: true,
            dragBoundFunc: function (pos) {

                var newX = pos.x;



                return {
                    x: newX,
                    y: this.absolutePosition().y,
                };
            },

            strokeWidth: 5
        });
        circle.on('dragmove', () => {
            if (circle.position().x < 314) {
                circle.position({ x: 314, y: circle.position().y })
            } else if (circle.position().x > 2064) {
                circle.position({ x: 2064, y: circle.position().y })
            }
        });

        groupText.add(circle);

    }
    Textpre.on('mouseover', () => {

    });

    Textpre.on('dblclick dbltap', (e) => {
        textAreaPosition(e.target)
    });
    Textpre.on('transform', (e) => {
        updatePos();
    });

    Textpre.on('dragstart', (e) => {
        transformer.nodes([e.target]);
        updatePos();
        layer.draw();


    });

    layer.add(groupText);
    setTimeout(function () {
        Textpre.verticalAlign('middle');
        Textpre.width(width);
        Textpre.align(align);


    }, 1000);

    layer.draw();
}
var m = 0;


var i = 0;

$("#addText").click(function () {
    var layer = stage.findOne("#"+$("#currentLayer").val());
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

        padding: 30,
        name: 'text'
    });
    Text.x((stageWidth / 2) - Text.width() / 2)
    Text.y((stageHeight / 2) - Text.height() / 2)
    var groupText = new Konva.Group({ textId: i.toString() + 'text' });
    groupText.add(Text);
    layer.add(groupText);
    transformer.nodes([Text]);
    groupTrans.moveToTop();
    updatePos()
    Text.on('transform', function () {

        updatePos();
    })

    Text.on('transformstart', function (e) {
        $("#draggable").fadeOut(100);
        generateTextWidget(e.target); 
    })

    Text.on('transformend', function (e) {
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target); 
    })


    Text.on('mouseover', function (e) {

    });


    Text.on('mousedown touchstart', (e) => {
        
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target); 
    });
    
    Text.on('dblclick dbltap', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        textAreaPosition(e.target)
    });
    Text.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        layer.draw();
        $("#draggable").fadeOut(100);
    });
    Text.on('dragend',(e)=>{
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target)

    })
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
});

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

    $("#opacity").val(Text.opacity());
    $("#text-font-edit").val(Text.fontFamily());
    $("#text-font-edit").css("font-family", '"' + font + '"');
    $("#input-text-edit").css("font-family", '"' + font + '"');
    $("#input-color-edit").val(Text.fill());
    const colorButton = document.getElementById("text-color-button");

    colorButton.style.backgroundColor = Text.fill(); 
    $("#input-edit-id").val(Text.id());

    var textPosition = Text.absolutePosition();

    var position = $(".konvajs-content").position();
 
    var toolbox = document.getElementById('draggable');
    const adjustedTop = (position.top + (textPosition.y*zoom));
    const adjustedLeft = (position.left + textPosition.x*zoom);
    var positionTop = adjustedTop + (((Text.height()*zoom) * Text.getAbsoluteScale().y) + 50);
    var positionLeft = adjustedLeft + (((Text.width()*zoom) / 2) * Text.getAbsoluteScale().x) - ((toolbox.offsetWidth / 2));
    if($(window).outerWidth()< 450){
        toolbox.style.position = 'fixed';
        toolbox.style.bottom ='0px';
        toolbox.style.left = '0px';  
    }else
    {
        toolbox.style.position = 'absolute';
        toolbox.style.top = positionTop + 'px';
        toolbox.style.left = positionLeft + 'px';
    }
    $("#widget-figures").fadeOut(100);
}
function textAreaPosition(Text){
    var textPosition = Text.absolutePosition(); 
    var position = $(".konvajs-content").position();
    console.log(textPosition.y*zoom)
    const adjustedTop = (position.top + (textPosition.y*zoom));
    const adjustedLeft = (position.left + textPosition.x*zoom);
        $("#input-text-edit").css("position", "absolute");
        $("#input-text-edit").css("display", "block");
        $("#input-text-edit").css("z-index", "999999")
        $("#input-text-edit").css("font-size", (Text.fontSize()* Text.getAbsoluteScale().x)*zoom  + "px");
        $("#input-text-edit").css("border", "none");
        $("#input-text-edit").css("margin", "0px");
        $("#input-text-edit").css("padding", (Text.padding() * Text.getAbsoluteScale().x)*zoom  + "px");
        $("#input-text-edit").css("overflow", "hidden");
        $("#input-text-edit").css("outline", "none");
        $("#input-text-edit").css("resize", "none");
        $("#input-text-edit").css("background", "none");
        $("#input-text-edit").css("color", "rgba(0, 0, 0, 0.0)");
        $("#input-text-edit").css("caret-color", Text.fill());
        $("#input-text-edit").css("line-height", Text.lineHeight());
        $("#input-text-edit").css("text-align", Text.align());
        $("#input-text-edit").css("transform-origin", "top left");
        $("#input-text-edit").css("width", ((Text.width() * Text.getAbsoluteScale().x)*zoom + 'px'));
        $("#input-text-edit").css("height", ((Text.height() * Text.getAbsoluteScale().y)*zoom + 'px'));
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
            updatePos();
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
}
$('#bgcolor').on('input',
    function () {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        cor = $('#bgcolor').val();
        var node = layer.findOne("#"+$('#bgcolor').attr("object-id"))
        node.setAttrs({
            fill: $('#bgcolor').val()
        });
        layer.draw();
        const colorButton = document.getElementById("bg-color-button");

        colorButton.style.backgroundColor = this.value; 
    });
$('#bg-remove').on('click',
    function () {
        var layer = stage.findOne("#"+$("#currentLayer").val());     
        var node = layer.findOne("#"+$('#bgcolor').attr("object-id"))
        node.destroy()
        $("#widget-bg").fadeOut(100);
        layer.draw();
    });
$('#draw-color').on('input',
    function () {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        cor = $('#draw-color').val();
        var node = transformer.nodes()[0];
        node.setAttrs({
            fill: $('#draw-color').val()
        });
        layer.draw();
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = this.value; 
    });
sliders.forEach(function (attr) {
    $('#' + attr).on('input',
        function () {
            value = $('#' + attr).val();
            var node = transformer.nodes()[0];
            const porcentagem = (value / $("#"+attr).attr("max")) * 100;
            $("." + attr).text(parseInt(porcentagem) + "%");
            if (node) {
                node[attr](parseFloat(value));
                layer.batchDraw();
            }
        });
});

$("#add-tri").on('click', function () {
    var layer = stage.findOne("#"+$("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var node = new Konva.RegularPolygon({
        id: i.toString() + 'tri',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        sides: 3,
        radius: 200,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
    });
    node.x((stageWidth / 2) - node.width() / 2)
    node.y((stageHeight / 2) - node.height() / 2)
    var groupRect = new Konva.Group({ textId: i.toString() + 'tri' });
    groupRect.add(node);
    layer.add(groupRect);
    transformer.nodes([node]);
    layer.draw();

    generateNodeWidget(node)

    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function (e) {
        generateNodeWidget(e.target);

    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        generateNodeWidget(e.target);

    });

    node.on('dragend', (e)=>{
        generateNodeWidget(e.target);
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#widget-node").fadeOut(100);
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        layer.draw();
    });
    groupTrans.moveToTop();
    updatePos();

})
$("#add-rect").on('click', function () {
    var layer = stage.findOne("#"+$("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var node = new Konva.Rect({
        id: i.toString() + 'rect',
        fill: Konva.Util.getRandomColor(),
        fakeShapeId: 'stage',
        width: 200,
        height: 200,
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
    });
    node.x((stageWidth / 2) - node.width() / 2)
    node.y((stageHeight / 2) - node.height() / 2)
    var groupRect = new Konva.Group({ textId: i.toString() + 'rect' });
    groupRect.add(node);
    layer.add(groupRect);
    transformer.nodes([node]);
    layer.draw();

    generateNodeWidget(node)
    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function (e) {
        generateNodeWidget(e.target)

    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        generateNodeWidget(e.target)
    });


    node.on('dragend', (e)=>{
        generateNodeWidget(e.target);
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer(); 

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#widget-node").fadeOut(100);
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        layer.draw();
    });

    updatePos();
})
function generateNodeWidget(node){
    var nodePosition = node.getAbsolutePosition();
    var stagePosition = $(".konvajs-content").offset();
    $("#widget-node").fadeIn(100);
    var widget = document.getElementById('widget-node');
    widget.style.position = 'absolute';

    const adjustedTop = (stagePosition.top + (nodePosition.y*zoom));
    const adjustedLeft = (stagePosition.left + (nodePosition.x*zoom));

    const className = node.getClassName();

    if (className === 'Rect') {
        var positionTop = adjustedTop + (((node.height()*zoom) * node.getAbsoluteScale().y)+20);
        var positionLeft = adjustedLeft  - ((widget.offsetWidth / 2) - ((node.width()*zoom)/2)* node.getAbsoluteScale().x);
    } else if (className === 'Circle') {
        var positionTop = adjustedTop + (((node.height()* zoom) * node.getAbsoluteScale().y));
        var positionLeft = adjustedLeft  - ((widget.offsetWidth / 2));
    } else if (className === 'RegularPolygon') {
        var positionTop = adjustedTop + ((200 * node.getAbsoluteScale().y));
        var positionLeft = adjustedLeft - ((widget.offsetWidth / 2));
    } else {
        console.log('Outro tipo:', className);
    }
    if($(window).outerWidth()< 450){
        widget.style.position = 'fixed';
        widget.style.bottom ='0px';
        widget.style.left = '0px';
        widget.style.width = "100%";  
    }else
    {
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
    }
    

    $("#draw-color").attr("disabled", false);
    $("#draw-color").val(node.fill());
    const colorButton = document.getElementById("node-color-button");
    $("#widget-figures").fadeOut(100);
    colorButton.style.backgroundColor = node.fill(); 
    $("#draw-color").attr("object-id", node.id());
}
$("#add-bg").on('click', function(){
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var background = layer.findOne('.background');
    
    if (background) {
        background.destroy();
        layer.draw();
    }
    var bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,
        id: "background"+layerIndex,
        name:"background",
        fill: $('#bgcolor').val(),
    });

    bg.on("mousedown touchstart", function() {
        if(!drawMode){
            $("#widget-bg").fadeIn(100);
            var position = $(".preview-img").offset();
            var widget = document.getElementById('widget-bg');
            var positionTop = position.top + $(".preview-img").height()+10;
            var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    
            if($(window).outerWidth()< 450){
                widget.style.position = 'fixed';
                widget.style.bottom ='0px';
                widget.style.left = '0px';
                widget.style.width = "100%";  
            }else
            {
                widget.style.position = 'absolute';
                widget.style.top = positionTop + 'px';
                widget.style.left = positionLeft + 'px';
            }
            

        }

    });

    layer.add(bg);
    bg.moveToBottom();
    layer.draw();
})

$("#add-circle").on('click', function () {
    var layer = stage.findOne("#"+$("#currentLayer").val());
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    i++;
    var node = new Konva.Circle({
        id: i.toString() + 'circle',
        fill: Konva.Util.getRandomColor(),
        radius: 100 + Math.random() * 20,
        shadowBlur: 10,
        fakeShapeId: 'stage',
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        name: "draw",
        draggable: true,
    });

    node.x((stageWidth / 2) - node.width() / 2)
    node.y((stageHeight / 2) - node.height() / 2)
    var groupCircle = new Konva.Group({ textId: i.toString() + 'circle' });
    groupCircle.add(node);
    layer.add(groupCircle);
    transformer.nodes([node]);

    layer.draw();

    generateNodeWidget(node)

    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function (e) {
        generateNodeWidget(e.target);
    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        generateNodeWidget(e.target);
    });


    node.on('dragend', (e)=>{
        generateNodeWidget(e.target);
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer();

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $("#widget-node").fadeOut(100);
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        layer.draw();
    });
    groupTrans.moveToTop();
    updatePos();

})

function updatePos() {
    var sizeButton = stage.find(".button-size")[0];
    var rotateButton = stage.find(".button-edit")[0];

    sizeButton.position({
        x: transformer.findOne('.bottom-right').position().x - 5,
        y: transformer.findOne('.bottom-right').position().y - 5
    });
    rotateButton.position({
        x: transformer.findOne('.top-center').position().x -8,
        y: transformer.findOne('.top-center').position().y - 58
    });
}

function cleanStage() {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    userLayers.forEach((layer) => {
        layer.destroy();
    });
    layer = new Konva.Layer({
        id:"layer"+getRandomInt(1000),
        name:"Plano de fundo",
        zIndex:1
    });
    stage.add(layer);
    $("#currentLayer").val(layer.id())
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


    $("#stage-parent").show();

    stageWidth = 800;
    stageHeight = 600;
    originalStageWidth = stageWidth;
    originalStageHeight = stageHeight;
    $(".header").text(title+" - "+stageWidth+"x"+stageHeight )
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
        id:"layer"+getRandomInt(1000),
        name:"Plano de fundo",
        zIndex:1
    });
    var transformerLayer = new Konva.Layer({
        id:"transformerLayer",
        zIndex:0
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
        name:"background",
        fill: $('#bgcolor').val(),
    });

    $('#bgcolor').attr("object-id", background.id());

    background.on('mouseover', function () {

    });

    background.on("mousedown touchstart", function() {
        if(!drawMode){
            $("#widget-bg").fadeIn(100);
            var position = $(".preview-img").offset();
            var widget = document.getElementById('widget-bg');
            var positionTop = position.top + $(".preview-img").height()+10;
            var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    
            if($(window).outerWidth()< 450){
                widget.style.position = 'fixed';
                widget.style.bottom ='0px';
                widget.style.left = '0px';
                widget.style.width = "100%";  
            }else
            {
                widget.style.position = 'absolute';
                widget.style.top = positionTop + 'px';
                widget.style.left = positionLeft + 'px';
            }
            

        }
    });


    var isPaint = false;
    var mode = 'brush';
    var lastLine;
    stage.on('mouseover',function(){
        if (drawMode) {
            if(mode=='brush'){
                $(".editor").css("cursor", "url('images/cursor.cur'), auto")
            }else{
                $(".editor").css("cursor", "url('images/eraser.cur'), auto")
            }
        }else
        {
            $(".editor").css("cursor", "")
        }
    })
    stage.on('mousedown touchstart', function (e) {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        if (drawMode) {

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
                stroke: 'black',
                strokeWidth: 2,
                stroke: color,
                strokeWidth: size,
                globalCompositeOperation:
                mode === 'brush' ? 'source-over' : 'destination-out',
                lineJoin: 'round',
                lineCap: 'round',
            });
        
            var layer = stage.findOne(`#${$("#currentLayer").val()}`);
            layer.add(lastLine);
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
    });
    let isHandlingEvent = false;

    stage.on('mouseup touchend', function (e) {
    
        isPaint = false;

    });
    stage.on('mousemove touchmove', function (e) {
        if (drawMode) {
            stage.draw();

            if (!isPaint) {
                return;
            }
            e.evt.preventDefault();

            var pointerPosition = stage.getPointerPosition();
    
            if (!pointerPosition) return;
    
            var scale = stage.scale();
            var stagePosition = stage.position();
    
            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };

            var newPoints = lastLine.points().concat([adjustedPosition.x, adjustedPosition.y]);
            lastLine.points(newPoints);
    

            layer.draw();
        }
    });

    $(".draw-mode").on('click', function () {
        mode = $(this).attr("draw-mode")
        $(".draw-mode").removeClass("active");
        $(this).addClass("active");
        if(mode =="brush"){
            $(".editor").css("cursor", "url('images/cursor.cur'), auto")
        }else{
            $(".editor").css("cursor", "url('images/eraser.cur'), auto")
        }
    });
    


    stage.on('click tap dragstart', function (e) {

        if ((e.target.name() != 'image') && (e.target.name() != 'button-up') && (e.target.name() != 'draw') && (e.target.name() != 'button-down') && ((e.target.name() != 'text')) && (e.target.name() != 'button-edit') && (e.target.name() != 'button-copy')) {

            $("#draggable").fadeOut(100);
            $("#widget-node").fadeOut(100);

            $("#widget-image").fadeOut(100);
            $("#widget-figures").fadeOut(100);
            transformer.nodes([]);
            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", "0")
                $("#" + attr).prop("disabled", true);
            });
            layer.draw();
            $("#draw-color").val("#ffffff");
            $("#draw-color").attr("disabled",true);
            return;
        }


        if ((e.target.name() === 'image') || (e.target.name() === 'text') || (e.target.name() === 'background') || (e.target.name() === 'draw')) {
            if ((drawMode)&&(e.target.name() != "background")) {
                $("#draw").click();
            }
            sliders.forEach(function (attr) {
                $("#" + attr).attr("object-id", e.target.id())
                $("#" + attr).val(e.target[attr]())
                const porcentagem = (e.target[attr]() / $("#"+attr).attr("max")) * 100;
                $("." + attr).text(parseInt(porcentagem)+"%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
            if(e.target.name() != 'text'){
                $("#draggable").fadeOut(100);
                $("#widget-figures").fadeOut(100);
            }
            if((e.target.name() != 'background')|| (drawMode) ){
                $("#widget-bg").fadeOut(100);
                $("#widget-figures").fadeOut(100);
            }
            if(e.target.name() != 'draw'){
                $("#widget-node").fadeOut(100);
                $("#widget-figures").fadeOut(100);
            }
            if(e.target.name() != 'image'){
                $("#widget-image").fadeOut(100);
                $("#widget-figures").fadeOut(100);
            }
            if(e.target.name() != "background")
            {
                transformer.nodes([e.target]);
            }
            
            groupTrans.moveToTop();

            updatePos();
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
        var text = stage.find("#" + $("#input-edit-id").val())[0];
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
    $("#opacity").on('input', function () {

        var text = stage.find("#" + $("#input-edit-id").val())[0];

        text.opacity($(this).val());
        layer.draw();
    });

    $("#text-font-edit").on('change', function () {

        var text = stage.find("#" + $("#input-edit-id").val())[0];
        $(this).css("font-family", '"' + $(this).val() + '"');
        text.fontFamily($(this).val());
        transformer.forceUpdate()
        updatePos();
        layer.draw();
    });

    transformer.nodes([]);

    $(".btn-align").on("click", function () {
        const currentIcon = icons[currentIndex];
        $(this).find("i").attr("class", `fa ${currentIcon}`);

        var text = stage.find("#" + $("#input-edit-id").val())[0];
        if (!text) return;
        const newAlignment = alignments[currentIndex];
        text.align(newAlignment);
        layer.draw();
    
        currentIndex = (currentIndex + 1) % alignments.length;
    
    });
    $(".btn-decoration").on('click', function () {
        var text = stage.find("#" + $("#input-edit-id").val())[0];
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

    var position = $(this).offset();
    var widget = document.getElementById('add-text-widget');
    var positionTop = position.top-100;
    var positionLeft = position.left-100;
    widget.style.position = 'absolute';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    widget.style.display = "block";


});

$('#info-widget').on('click', function () {

    var position = $(this).position();
    var widget = document.getElementById('widget-info');
    var positionTop = position.top + 50;
    var positionLeft = position.left - 250;
    widget.style.position = 'absolute';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    widget.style.display = "block";

});
$(document).on('mousedown touchstart', function (e) {
    if (!$(e.target).closest("#draggable").length && !$(e.target).is("canvas") && !$(e.target).closest("#widget-bg").length && !$(e.target).closest("#widget-node").length && !$(e.target).closest("#widget-image").length&& !$(e.target).closest("#widget-settings").length) {
        var transformers = stage.find('Transformer');
        if (transformers.length > 0) {
            for (var i = 0; i < transformers.length; i++) {
                transformers[i].nodes([]);
            }
            layer.draw();
            $("#draggable").fadeOut(100);
            $("#widget-bg").fadeOut(100);
            $("#widget-node").fadeOut(100);
            $("#widget-image").fadeOut(100);
        }
        
    }
});
function addTransformer() {
    var sizeImage = new Image();
    var rotateImage = new Image();
    var transformer = new Konva.Transformer({
        anchorStyleFunc: (anchor) => {
            anchor.cornerRadius(20);
            if (anchor.hasName('bottom-right')|| anchor.hasName('rotater')) {
              anchor.height(16);
              anchor.width(16)
            }else{
                anchor.height(7);
                anchor.width(7) 
            }
          },
        anchorStroke: 'black',
        anchorFill: 'black',
        borderStroke: 'gray',
        centeredScaling: true,
        enabledAnchors: [
            'bottom-right', 'middle-right', 'middle-left',
            'bottom-center', 'top-center'
        ],
        keepRatio: true,
        draggable: true,
        nodes: [],
    });

    transformer.flipEnabled(false);
    transformer.borderDash([2, 2]);
    transformer.anchorCornerRadius(5);

    var rotateButton = new Konva.Image({

        image: rotateImage,
        width: 20,
        height: 20,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-edit'
    });
    var sizeButton = new Konva.Image({
        width: 20,
        height: 20,
        image: sizeImage,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-size'

    });

    rotateButton.listening(false);

    sizeButton.listening(false);

    sizeImage.src = "images/size-icon.png";
    rotateImage.src = "images/edit-icon.png" 
    transformer.add(sizeButton);
    transformer.add(rotateButton);
    transformer.rotationSnaps([0, 90, 180, 270]);

    return transformer;
}

$("#btn-settings").click(function(){
    $("#widget-settings").toggle();
    var position = $("#widget-image").offset();
    var widget = document.getElementById('widget-settings');
    var positionTop = position.top - $("#widget-image").outerHeight()-20;
    var positionLeft = position.left + ($("#widget-image").width() / 2 - (widget.offsetWidth / 2));

  
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
    
    
    $("#widget-figures").fadeOut(100);
});

var color;
var size;
$("#draw").on("click", function () {
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    $(this).css('background-color', "#424344");
    $(".editor").css("cursor", "url('images/cursor.cur'), auto")
    color = $("#brush-color").val();
    size = $("#brush-size").val();
    $("#brush-size-text").text(" "+size);
    if (!drawMode) {
        drawMode = true;
        $("#widget-draw").fadeIn(100);
        $(".draw-mode[draw-mode='brush']").addClass("active");
        const colorButton = document.getElementById("brush-color-button");

        colorButton.style.backgroundColor = color; 
        var position = $("#widget-figures").offset();
        var widget = document.getElementById('widget-draw');
        var positionTop = position.top - $("#widget-figures").height();
        var positionLeft = position.left + ($("#widget-figures").width() / 2 - (widget.offsetWidth / 2));

        if($(window).outerWidth()< 450){
            widget.style.position = 'fixed';
            widget.style.bottom ='0px';
            widget.style.left = '0px';
            widget.style.width = "100%";  
        }else
        {
            widget.style.position = 'absolute';
            widget.style.top = positionTop + 'px';
            widget.style.left = positionLeft + 'px';
        }
        
        $("#widget-figures").fadeOut(100);
        var widget = document.getElementById('widget-draw');
    } else {
        $(this).css('background', "transparent");
        $("#widget-draw").hide();
        drawMode = false;
    }

});
$("#brush-color,#brush-size").on('input', function () {
    color = $("#brush-color").val();
    size = $("#brush-size").val();

    const colorButton = document.getElementById("brush-color-button");
    
    $("#brush-size-text").text(" "+size+" ");

    colorButton.style.backgroundColor = this.value; 
})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

$("#add-layer").click(function(){
    if(stage.getLayers().length >= 5){
        return;
    }
    var layer2 = new Konva.Layer({
        id:"layernew"+getRandomInt(1000),
        name:"Camada "+layerIndex++
    });
    layer2.attrs.index = layerIndex++;
    $("#currentLayer").val(layer2.id())

    stage.add(layer2);
    stage.draw();
    updateLayerButtons();
});

$("#delete-layer").click(function () {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');
    let nextLayerId = userLayers[0].id();
    userLayers.forEach((layer) => {
        if (layer.id() !== "transformerLayer" && layer.id() ===  $("#currentLayer").val() && userLayers.length > 1) {
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
    updateLayerButtons();
});

function updateLayerButtons() {
    const layers = Array.from(stage.getLayers());
    const userLayers = layers.filter(layer => layer.id() !== 'transformerLayer');

    const sortedLayers = userLayers.sort((layer1, layer2) => {
        return layer1.zIndex() - layer2.zIndex();
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
        
            const isChecked = layer.visible() ? "checked" : "";
       
            const buttonHtml = `
                <li class="layer" layer-id="${layerId}">
                    <img src="${imgsrc}" class="layer-img" alt="Layer Image" style="max-width: 70px; max-height: 70px; width:auto; height:auto;">
                    <span class="layer-name">${layer.name()}</span>
                    <input class="check-visible" layer-id="${layerId}" type="checkbox" ${isChecked}>
                </li>
            `;
            $('#layers').append(buttonHtml);
        
            const newButton = $('#layers').find(`[layer-id='${layerId}']`);
        
            if ($("#currentLayer").val() === layerId) {
                newButton.addClass('active');
                background = layer.findOne(".background");
                if(background){
                    $("#bgcolor").attr("disabled",false);
                    $("#bgcolor").attr("object-id",background.id());
                    $("#bgcolor").val(background.fill());
                    const colorButton = document.getElementById("bg-color-button");

                    colorButton.style.backgroundColor = background.fill(); 
                }else{
                    $("#bgcolor").attr("disabled",true);

                    $("#bgcolor").val("#ffffff");
                    const colorButton = document.getElementById("bg-color-button");

                    colorButton.style.backgroundColor = "#ffffff"; 
                }
            }
        });
    });
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
            layer.listening(true);
        } else {
           
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

    updateLayerButtons();
});

$('#layers').on('change', '.check-visible', function () {
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

$(".btn-delete").click(function(){
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var node = transformer.nodes()[0];

    node.destroy();

    transformer.nodes([]);
    layer.draw();
    if ($("#input-edit-id").val() == node.id()) {
        $("#draggable").fadeOut(100);
    }
    $("#widget-image").fadeOut(100);
    $("#widget-node").fadeOut(100);
})

$(".btn-copy").click(function()
{
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var node = transformer.nodes()[0];

    i++;
    if(node.name()==="image"){
        var NodeClone = node.clone({
            id: 'imagecopy' + i.toString(),
            y: node.position().y - 100,
            name: node.name(),
        });
        NodeClone.cache();
    }else{
        var NodeClone = node.clone({
            id: i.toString()+"copy",
            y: node.position().y - 100,
            name: node.name(),
        });
    }

    if (node.getAttr('fakeShapeId') != "stage") {


        var fakeShape = stage.find("#" + node.getAttr('fakeShapeId'))[0];

        var groupImage = new Konva.Group({
            clipFunc: (ctx) => {

                ctx.save();
                ctx.translate(fakeShape.x(), fakeShape.y())
                ctx.rotate(Konva.getAngle(fakeShape.rotation()))
                ctx.rect(0, 0, fakeShape.width() * fakeShape.scaleX(), fakeShape.height() * fakeShape.scaleY());
                ctx.restore()

            },
            textId: NodeClone.id()
        });
        groupImage.add(NodeClone);
        layer.add(groupImage);
        groupImage.moveUp();
    } else {
        var groupImage1 = new Konva.Group({ textId: NodeClone.id() })
        groupImage1.add(NodeClone);
        layer.add(groupImage1);
    }

    groupTrans.moveToTop();
    transformer.nodes([NodeClone]);
    updatePos();
    NodeClone.zIndex(node.zIndex() + 1);
    layer.draw();

});
$(".moveUp").click(function()
{
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var node = transformer.nodes()[0];

    var textGroup = layer.find(nd => {
        return nd.getAttr("textId") === node.id();
    });
    
    if (textGroup) {
        node = textGroup[0];
    }

    node.moveUp();
    groupTrans.moveToTop();
    layer.draw();
});
$(".moveDown").click(function()
{
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var node = transformer.nodes()[0];

    var textGroup = layer.find(nd => {
        return nd.getAttr("textId") === node.id();
    });
    
    if (textGroup) {
        node = textGroup[0];
    }

    node.moveDown();
    groupTrans.moveToTop();
    layer.draw();
});
$('#zoom-slider').on('input', function () {
  
    zoomElement.style.transform = `scale(${zoom = $('#zoom-slider').val()})`

});

$("#btn-widget-figures").click(function(){
    $("#widget-figures").fadeIn(100);
    var position = $(".preview-img").offset();
    var widget = document.getElementById('widget-figures');
    var positionTop = position.top + $(".preview-img").height()+10;
    var positionLeft = position.left + ($(".preview-img").width() / 2 - (widget.offsetWidth / 2));
    if($(window).outerWidth()< 450){
        widget.style.position = 'fixed';
        widget.style.bottom ='0px';
        widget.style.left = '0px';
        widget.style.width = "100%";  
    }else
    {
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
    }
    
})
$('#reset-zoom').on('click', function () {
   
    zoomElement.style.transform = `scale(${zoom = 1})`;
    $("#zoom-slider").val(1);

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

$("#resize-stage").click(function(){
    const userWidth = $("#resize-input-width").val();
    const userHeight = $("#resize-input-height").val();


    if (userWidth > 0 && userHeight > 0) {
        $(".header").text(title+" - "+userWidth+"x"+userHeight )
        setNewCanvasSize(userWidth, userHeight);
        $("#resize-stage-prompt").fadeOut(100);
    }
})

$("#resize-stage-prompt-btn").click(function(){
    $("#resize-stage-prompt").fadeIn(100);
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    const elementWidth = $("#resize-stage-prompt").outerWidth();
    const elementHeight = $("#resize-stage-prompt").outerHeight();

    const left = (windowWidth - elementWidth) / 2;
    const top = (windowHeight - elementHeight) / 2;

    $("#resize-stage-prompt").css({
        position: 'absolute', 
        left: left + 'px',
        top: top + 'px',
    });
})


$("#new-image").click(function(){

    const userWidth = $("#input-width").val();
    const userHeight = $("#input-height").val();
    title = $("#input-title").val();

    if (userWidth > 0 && userHeight > 0) {
        setNewCanvas(userWidth, userHeight);
        $(".header").text(title+" - "+userWidth+"x"+userHeight )
        $("#new-image-prompt").fadeOut(100);
    }
})


$("#new-image-prompt-btn").click(function(){
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

    originalStageWidth = userWidth;
    originalStageHeight = userHeight;
    stageWidth = userWidth
    stageHeight = userHeight;
    stage.width(userWidth);
    stage.height(userHeight);

    adjustContainerToFitStage('#stage-parent', userWidth, userHeight); 
    fitStageIntoParentContainer();
    stage.batchDraw();
    readjustBackground();
}

function readjustBackground(){
    var layer = stage.findOne("#"+$("#currentLayer").val());
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

    originalStageWidth = userWidth;
    originalStageHeight = userHeight;
    stageWidth = userWidth
    stageHeight = userHeight;
    stage.width(userWidth);
    stage.height(userHeight);
    cleanStage();
    $("#add-bg").click();
    stage.batchDraw();

    adjustContainerToFitStage('#stage-parent', userWidth, userHeight); 
    fitStageIntoParentContainer();
    
}
function adjustContainerToFitStage(containerId, stageWidth, stageHeight) {
    const container = document.querySelector(containerId);
    const container2 = document.querySelector("#preview");
    const containerWidth = container2.offsetWidth;
    const containerHeight = container2.offsetHeight;
    const scaleX = containerWidth / originalStageWidth;
    const scaleY = containerHeight / originalStageHeight;
    const scale = Math.min(scaleX, scaleY); 

    container.style.width = stageWidth * scale+"px";
    container.style.height = stageHeight * scale+"px";

}


zoomElement.addEventListener("wheel", function(e) {
    if (!e.ctrlKey) return; 

    e.preventDefault(); 

    if (e.deltaY > 0) {    
        zoomElement.style.transform = `scale(${zoom -= ZOOM_SPEED})`;  
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

    const dataURL = stage.toDataURL();

    fitStageIntoParentContainer();

    const link = document.createElement('a');
    link.download = title;
    link.href = dataURL;
    link.click();
}