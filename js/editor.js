$(document).ready(function () {
    $(".close").on('click', function (e) {
        $(this).closest(".widget").hide();
    });


    $("#models-category").click(function () {
        $("#widget-products").show();
    })
    $("#add-image").click(function () {
        if(drawMode){
            $("#draw").click();
        }
        $("#input-image").click();
    })

    $("#text-font").on('change', function () {
        $(this).css("font-family", $(this).val());
        $("#input-text").css("font-family", $(this).val());
    })
    $("#input-color-edit").on('input', function () {

        var texto = stage.find("#" + $("#input-edit-id").val())[0];

        texto.fill($(this).val());
        layer.draw();
    });
    $("#input-text-edit").on('input', function () {
        var texto = stage.find("#" + $("#input-edit-id").val())[0];

        texto.text($(this).val());
        updatePos();
        layer.draw();
        var textPosition = texto.absolutePosition();
        $("#input-text-edit").css("width", (texto.width() * texto.getAbsoluteScale().x + 'px'));
        $("#input-text-edit").css("height", (texto.height() * texto.getAbsoluteScale().y + 'px'));

    });
});
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

    var imageObj1 = new Image();
    var imageObj2 = new Image();
    var imageObj10 = new Image();

    imageObj10.src = URL.createObjectURL(image);
    imageObj10.onload = function () {
        var image6 = new Konva.Image({
            x: parseFloat(posx),
            y: parseFloat(posy),
            image: imageObj10,
            name: 'image0',
            id: 'image' + l,
            draggable: true,
            fakeShapeId: id

        });


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
            var setx = fakeShape.x() + ((fakeShape.width() * fakeShape.scaleX() / 2) - (image6.width() / 2));
            var sety = fakeShape.y() + ((fakeShape.height() * fakeShape.scaleY() / 2) - (image6.height() / 2));
            image6.setAttrs({ x: setx, y: sety, rotation: fakeShape.rotation() })
            fakeShape.listening(false);
            fakeShape.hide();
            var camera = layer.find(node => {
                return node.getAttr("camerafakeShapeId") === id;
            });
            camera.hide();
            groupImage.add(image6);
            layer.add(groupImage);
        } else {
            image6.x((stageWidth / 2) - image6.width() / 2);
            image6.y((stageHeight / 2) - image6.height() / 2);
            var groupImage = new Konva.Group({ textId: 'image' + l });
            groupImage.add(image6)
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

        // function to apply crop
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
        image6.on('dragstart transformstart click tap', (e) => {
            transformer.nodes([e.target]);
            limitGroup.moveToTop();
            if (e.target.getAttr('fakeShapeId') != "stage") {

                var shape = stage.find("#" + e.target.getAttr('fakeShapeId'))[0];

                limit.setAttrs({
                    width: shape.width(),
                    height: shape.height(),
                    scaleX: shape.scaleX(),
                    scaleY: shape.scaleY(),
                    rotation: shape.rotation(),
                    x: shape.x(),
                    y: shape.y()
                })
            }
            limit.show();
            updatePos();
            layer.draw();
        });

        
        image6.on('transformend', (e) => {


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

            layer.draw();
        });

        image6.on('dragend', (e) => {

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


            layer.draw();
        });



        image6.on('mouseover', function () {
            

        });
        image6.on('transform', (e) => {
            limitGroup.moveToTop();
            if (e.target.getAttr('fakeShapeId') != "stage") {

                var shape = stage.find("#" + e.target.getAttr('fakeShapeId'))[0];

                limit.setAttrs({
                    width: shape.width(),
                    height: shape.height(),
                    scaleX: shape.scaleX(),
                    scaleY: shape.scaleY(),
                    rotation: shape.rotation(),
                    x: shape.x(),
                    y: shape.y()
                })
            }




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
        transformer.nodes([image6]);

        groupTrans.moveToTop();
        updatePos();
    }
}


$("#widget-bg-btn").click(function () {
    $("#widget-background").hide();
    var editor = $(".editor");
    $("#widget-bg2").css("top", editor.position().top + editor.height() / 2 - $("#widget-bg2").height() / 2);
    $("#widget-bg2").css("left", editor.position().left + editor.width() / 2 - $("#widget-bg2").width() / 2);
    $("#widget-bg2").show();

});

$("#vazio").click(function () {
    cleanStage()
    rect1.setAttrs({
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

var v = 0;
function createText(texto, color, posx, posy, font, fontSize, circle, textDecoration, align, fontStyle, scalex, scaley, rotation, width) {
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
    // hide on enter
    Textpre.on('dblclick dbltap', (e) => {
        generateTextWidget(e.target);
        $("#draggable").show();
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
        id: i.toString() + 'texto',
        draggable: true,
        fill: "black",
        fakeShapeId: 'stage',
        verticalAlign: 'middle',
        padding: 70,
        name: 'text'
    });
    Text.x((stageWidth / 2) - Text.width() / 2)
    Text.y((stageHeight / 2) - Text.height() / 2)
    var groupText = new Konva.Group({ textId: i.toString() + 'texto' });
    groupText.add(Text);
    layer.add(groupText);
    transformer.nodes([Text]);
    groupTrans.moveToTop();
    updatePos()
    Text.on('transform', function () {


        updatePos();
    })

    Text.on('mouseover', function () {
        
    });



    Text.on('dblclick dbltap', (e) => {

        generateTextWidget(e.target)
        $("#draggable").show();


    });
    Text.on('dragstart', (e) => {
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        layer.draw();


    });

    stage.draw();
    $("#add-text-widget").hide();
    $("#input-text").val('');
});

$("#editText").click(function () {
    $("#draggable").hide(hideCallBack);



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
    $(".btn-align").removeClass("selected");
    $(".btn-align[value='" + Text.align() + "']").addClass("selected");
    $("#input-text-edit").val(Text.text());

    $("#opacity").val(Text.opacity());
    $("#text-font-edit").val(Text.fontFamily());
    $("#text-font-edit").css("font-family", '"' + font + '"');
    $("#input-text-edit").css("font-family", '"' + font + '"');
    $("#input-color-edit").val(Text.fill());
    $("#input-edit-id").val(Text.id());

    var textPosition = Text.absolutePosition();

    var position = $(".konvajs-content").position();
    var toolbox = document.getElementById('draggable');
    toolbox.style.display = 'block';

    var positionTop = position.top + textPosition.y + ((Text.height() * Text.getAbsoluteScale().y) + 50);
    var positionLeft = position.left + textPosition.x + ((Text.width() / 2) * Text.getAbsoluteScale().x) - ((toolbox.offsetWidth / 2));
    toolbox.style.position = 'absolute';
    toolbox.style.top = positionTop + 'px';
    toolbox.style.left = positionLeft + 'px';
    toolbox.style.display = "inline !important";
    $("#input-text-edit").css("position", "absolute");
    $("#input-text-edit").css("display", "block");
    $("#input-text-edit").css("z-index", "999999")
    $("#input-text-edit").css("font-size", Text.fontSize() * Text.getAbsoluteScale().x + "px");
    $("#input-text-edit").css("border", "none");
    $("#input-text-edit").css("margin", "0px");
    $("#input-text-edit").css("padding", Text.padding() * Text.getAbsoluteScale().x + "px");
    $("#input-text-edit").css("overflow", "hidden");
    $("#input-text-edit").css("outline", "none");
    $("#input-text-edit").css("resize", "none");
    $("#input-text-edit").css("background", "none");
    $("#input-text-edit").css("color", "rgba(0, 0, 0, 0.0)");
    $("#input-text-edit").css("caret-color", Text.fill());
    $("#input-text-edit").css("line-height", Text.lineHeight());
    $("#input-text-edit").css("text-align", Text.align());
    $("#input-text-edit").css("transform-origin", "top left");
    $("#input-text-edit").css("width", (Text.width() * Text.getAbsoluteScale().x + 'px'));
    $("#input-text-edit").css("height", (Text.height() * Text.getAbsoluteScale().y + 'px'));
    $("#input-text-edit").css("top", position.top + textPosition.y);
    $("#input-text-edit").css("left", position.left + textPosition.x);



    var textarea = document.getElementById('input-text-edit');
    textarea.focus();
    textarea.addEventListener('keydown', function (e) {

        // hide on enter
        // but don't hide on shift + enter

        // on esc do not set value back to node
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




}
var deitado = 0;
$("[name2=Deitado]").click(function () {
    if (window.screen.width < 768) {
        $('.parente').css("width", "70%");
        $('.parente').css("height", "70%");
    }



    if (deitado == 0) {



    } else {

    }
    deitado = 1;
    var moldura = $('canvas');
    var preview = $('#bosta');
    stageWidth = 1000;
    stageHeight = 700;

    var container = document.querySelector('#parente');

    // now we need to fit stage into parent
    var containerWidth = container.offsetWidth;
    // to do this we need to scale the stage
    var scale = containerWidth / stageWidth;

    stage.width(stageHeight * scale);
    stage.height(stageWidth * scale);
    stage.scale({ x: scale, y: scale });
    stage.draw();
    limit.setAttrs({ width: stageHeight, height: stageWidth })
    rect1.setAttrs({
        width: stageHeight,
        height: stageWidth
    });

    layer.draw();

});

$('#bgcolor').on('input',
    function () {
        cor = $('#bgcolor').val();
        rect1.setAttrs({
            fill: $('#bgcolor').val()
        });
        layer.draw();

    });

$('[name2="Em pé"]').click(function () {

    if (window.screen.width < 768) {
        $('.parente').css("width", "90%");
        $('.parente').css("height", "90%");
    }
    if (deitado == 1) {

    } else {

    }

    deitado = 0;
    var container = document.querySelector('#parente');
    // now we need to fit stage into parent
    var containerWidth = container.offsetWidth;
    // to do this we need to scale the stage
    var scale = containerWidth / stageWidth;

    stage.width(stageWidth * scale);
    stage.height(stageHeight * scale);
    stage.scale({ x: scale, y: scale });
    stage.draw();
    newObj = new Image()
    newObj.src = 'images/limit.png'
    newObj.onload = function () {
        limit.setAttrs({
            width: stageWidth,
            height: stageHeight,
            x: 0,
            y: 0,
            image: newObj
        });
    }
    rect1.setAttrs({
        width: stageWidth,
        height: stageHeight
    });
    layer.draw();


});

function updatePos() {
    var deleteButton = stage.find(".button-delete");
    var sizeButton = stage.find(".button-size");
    var editButton = stage.find(".button-edit");
    var moveUp = stage.find(".button-up");
    var moveDown = stage.find(".button-down");
    var buttonCopy = stage.find(".button-copy");
    deleteButton.position({
        x: transformer.findOne('.top-left').position().x - 15,
        y: transformer.findOne('.top-left').position().y - 15
    });
    sizeButton.position({
        x: transformer.findOne('.bottom-right').position().x - 5,
        y: transformer.findOne('.bottom-right').position().y - 5
    });
    editButton.position({
        x: transformer.findOne('.top-right').position().x - 5,
        y: transformer.findOne('.top-right').position().y - 15
    });
    moveUp.position({
        x: transformer.findOne('.top-left').position().x + 20,
        y: transformer.findOne('.top-left').position().y - 30
    });
    moveDown.position({
        x: transformer.findOne('.top-right').position().x - 40,
        y: transformer.findOne('.top-right').position().y - 30
    });
    buttonCopy.position({
        x: transformer.findOne('.bottom-left').position().x - 15,
        y: transformer.findOne('.bottom-left').position().y - 5
    });

}

function cleanStage() {
    stage.find('Transformer').nodes([]);
    stage.find('.background').destroy();
    stage.find('.fakeShape').destroy();
    stage.find('.camera').destroy();
    stage.find('.background-text').destroy();
    stage.find('.text').destroy();
    stage.find('.image0').destroy();
    stage.find('Circle').destroy();
}
var transformer;
var limit;
var limitGroup;
var stageWidth = 1000;
var stageHeight = 700;
var stage;
var tr;
var layer;
var rect1;
var group;
var deleteButton;
var editButton;
var sizeButton;
var buttonCopy;
var moveDown;
var groupTrans;
var moveUp;
$(function () {

    var imageObj1 = new Image();
    var imageObj2 = new Image();
    var imageObj3 = new Image();
    var buttonObj = new Image();
    var buttonObj2 = new Image();
    var copybtnObj = new Image();

    $("#parente").show();

    stageWidth = 1000;
    stageHeight = 700;

    stage = new Konva.Stage({
        container: 'container',
        width: stageWidth,
        height: stageHeight,
        id: "stage"

    });

    transformer = addTransformer();

    group = new Konva.Group({

    });
    layer = new Konva.Layer();
    stage.add(layer);

    rect1 = new Konva.Rect({
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,

        fill: $('#bgcolor').val(),
    });
    // add the shape to the layer

    limit = new Konva.Rect({
        x: 0,
        y: 0,
        name: 'buttons',
        draggable: false,
        fill: 'rgba(0,0,0,0)',
        stroke: 'green',
        strokeWidth: 3,
        strokeScaleEnabled: false,
        width: stageWidth,
        height: stageHeight,
        listening: false,
        dash: [6, 3]
    });
    limitGroup = new Konva.Group();
    limitGroup.add(limit);
    rect1.on('mouseover', function () {
        
    });
    
        var isPaint = false;
        var mode = 'brush';
        var lastLine;
    
        stage.on('mousedown touchstart', function (e) {
            if(drawMode){

                isPaint = true;
                var pos = stage.getPointerPosition();
                lastLine = new Konva.Line({
                  stroke: color,
                  strokeWidth: size,
                  globalCompositeOperation:
                    mode === 'brush' ? 'source-over' : 'destination-out',
                  // round cap for smoother lines
                  lineCap: 'round',
                  lineJoin: 'round',
                  // add point twice, so we have some drawings even on a simple click
                  points: [pos.x, pos.y, pos.x, pos.y],
                });
                layer.add(lastLine);
              }
        });
    
        stage.on('mouseup touchend', function () {
          isPaint = false;
        });
    
        // and core function - drawing
        stage.on('mousemove touchmove', function (e) {
            if(drawMode){
            stage.draw();
          if (!isPaint) {
            return;
          }
    
          // prevent scrolling on touch devices
          e.evt.preventDefault();
    
          const pos = stage.getPointerPosition();
          var newPoints = lastLine.points().concat([pos.x, pos.y]);
          lastLine.points(newPoints);
        }
        });
    
        var select = document.getElementById('tool');
        select.addEventListener('change', function () {
          mode = select.value;
        });
    
    stage.on('click tap', function (e) {
        // if we are selecting with rect, do nothing
        

        // if click on empty area - remove all selections
        if ((e.target.name() != 'image0') && (e.target.name() != 'button-up') && (e.target.name() != 'button-down') && ((e.target.name() != 'text')) && (e.target.name() != 'button-edit') && (e.target.name() != 'button-copy') && (e.target.name() != 'background-text')) {
            limit.hide();

            transformer.nodes([]);

            layer.draw();
            return;
        }

        if ((e.target.name() === 'image0') || (e.target.name() === 'text') || (e.target.name() === 'background-text')) {
            if(drawMode){
                $("#draw").click();
            }
            transformer.nodes([e.target]);
            drawMode = false;
            groupTrans.moveToTop();
            updatePos();
            layer.draw();
            return;
        }


        // do nothing if clicked NOT on our rectangles




        layer.draw();

    });


    rect1.on('dblclick dbltap', function () {
        var position = $(".konvajs-content").position();
        var widget = document.getElementById('widget-bg');
        var positionTop = position.top + 200;
        var positionLeft = position.left;
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';

        $("#widget-bg").show();
    });
    groupTrans = new Konva.Group();
    groupTrans.add(transformer);
    layer.add(groupTrans);
    layer.add(rect1);


    layer.add(group);
    layer.add(limitGroup);
    limit.hide();
    layer.draw();



    // let's think our stage virtual size will be 1000x1000px
    // but the real size will be different to fit user's page
    // so the stage will be 100% visible on any device

    // add circle into center


    function fitStageIntoParentContainer() {
        var container = document.querySelector('#parente');

        // now we need to fit stage into parent
        var containerWidth = container.offsetWidth;
        // to do this we need to scale the stage
        var scale = containerWidth / stageWidth;

        stage.width(stageWidth * scale);
        stage.height(stageHeight * scale);
        stage.scale({ x: scale, y: scale });
        stage.draw();
    }

    fitStageIntoParentContainer();


    // Create fullscreen editor



    // Show modal on click

    stage.draw();

});

$(function () {
    $(".btn-style").on('click', function () {
        var texto = stage.find("#" + $("#input-edit-id").val())[0];
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            texto.fontStyle(texto.fontStyle().replace("normal", ''));
            texto.fontStyle(texto.fontStyle().replace(" ", ''));
            texto.fontStyle(texto.fontStyle().replace($(this).attr("value"), ''));
        } else {
            texto.fontStyle(texto.fontStyle().replace("normal", ''));
            texto.fontStyle(texto.fontStyle().replace(" ", ''));
            $(this).addClass("selected");
            if (texto.fontStyle() == "") {
                texto.fontStyle($(this).attr("value"));
            } else {
                texto.fontStyle(texto.fontStyle() + ' ' + $(this).attr("value"));
            }

        }
        layer.draw();
    });
    $("#opacity").on('input', function () {

        var texto = stage.find("#" + $("#input-edit-id").val())[0];

        texto.opacity($(this).val());
        layer.draw();
    });
    $("#input-color-edit").on('input', function () {

        var texto = stage.find("#" + $("#input-edit-id").val())[0];

        texto.fill($(this).val());
        layer.draw();
    });
    $("#text-font-edit").on('change', function () {

        var texto = stage.find("#" + $("#input-edit-id").val())[0];
        $(this).css("font-family", '"' + $(this).val() + '"');
        texto.fontFamily($(this).val());
        layer.draw();
    });
    $("#bright").on('input', function () {
        var image = stage.find("#" + $("#image-id").val())[0];
        image.brightness($(this).val());
        layer.batchDraw();
    });

    transformer.nodes([]);
    $(".btn-align").on('click', function () {
        var texto = stage.find("#" + $("#input-edit-id").val())[0];

        $(".btn-align").removeClass("selected");
        $(this).addClass("selected");
        texto.align($(this).attr("value"));
        layer.draw();
    });
    $(".btn-decoration").on('click', function () {
        var texto = stage.find("#" + $("#input-edit-id").val())[0];
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            texto.textDecoration("");
        } else {
            $(".btn-decoration").removeClass("selected");
            $(this).addClass("selected");
            texto.textDecoration($(this).attr("value"));
        }


        layer.draw();
    });


    $(".widget").draggable({ disabled: true });
    $(".widget-header").on('mouseover touchstart', function (e) {
        $(".widget").draggable('enable');
        document.body.style.cursor = 'move';
    });


    $(".widget-header").on('mouseleave touchend', function (e) {
        $(".widget").draggable('disable');
        document.body.style.cursor = 'default';
    });
});
$('#widget-text').on('click', function () {
    if(drawMode){
        $("#draw").click();
    }

    // so position of textarea will be the sum of positions above:

    // create textarea and style it
    var position = $(this).position();
    var widget = document.getElementById('add-text-widget');
    var positionTop = position.top - 100;
    var positionLeft = position.left - 100;
    widget.style.position = 'absolute';
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    widget.style.display = "block";


});

$('#widget-image').on('click', function () {

    $("#input-image").attr("posx", '200');
    $("#input-image").attr("posy", '200');
    $("#input-image").attr("idshape", 'stage');
    $("#input-image").click();


});
$('#info-widget').on('click', function () {


    // so position of textarea will be the sum of positions above:

    // create textarea and style it
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
    if (e.target != $("canvas")[0]) {

        var transformers = stage.find('Transformer');
        transformers.each(function (transformer) {
            transformer.detach();
            limit.hide();
            layer.draw();

        });
    }
});
function addTransformer() {
    var imageObj1 = new Image();
    var imageObj2 = new Image();
    var imageObj3 = new Image();
    var buttonObj = new Image();
    var buttonObj2 = new Image();
    var copybtnObj = new Image();
    var transformer = new Konva.Transformer({
        anchorStroke: 'black',
        anchorFill: 'black',
        anchorSize: 7,
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
    transformer.borderDash([2, 2]);
    transformer.anchorCornerRadius(5);
    var deleteButton = new Konva.Image({

        image: imageObj1,
        width: 15,
        height: 15,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-delete'
    });
    var editButton = new Konva.Image({

        image: imageObj3,
        width: 15,
        height: 15,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-edit'
    });
    var sizeButton = new Konva.Image({
        width: 15,
        height: 15,
        image: imageObj2,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-size'

    });





    var buttonObj = new Image();
    var buttonObj2 = new Image();
    var copybtnObj = new Image();
    var buttonCopy = new Konva.Image({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        image: copybtnObj,
        name: 'button-copy',
        draggable: false,
        width: 15,
        height: 15,
        stroke: 'gray',
        strokeWidth: 0,
    });
    var moveDown = new Konva.Image({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        image: buttonObj2,
        name: 'button-down',
        draggable: false,
        width: 15,
        height: 15,
        stroke: 'gray',
        strokeWidth: 0,
    });
    var moveUp = new Konva.Image({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        image: buttonObj,
        name: 'button-up',
        draggable: false,
        width: 15,
        height: 15,
        stroke: 'gray',
        strokeWidth: 0,
    });
    moveUp.on("click tap", function () {
        var texto = transformer.nodes()[0];
        var textGroup = layer.find(node => {
            return node.getAttr("textId") === texto.id();
        });
        if (textGroup) {
            texto = textGroup[0];
        }

        texto.moveUp();
        groupTrans.moveToTop();
        layer.draw();
    });
    buttonCopy.on("click tap", function (e) {
        var texto = transformer.nodes()[0];

        i++;
        var TextClone = texto.clone({
            id: i.toString(),
            y: texto.position().y - 100,
            name: 'text',
        });
        if (texto.getAttr('fakeShapeId') != "stage") {


            var fakeShape = stage.find("#" + texto.getAttr('fakeShapeId'))[0];

            var groupImage = new Konva.Group({
                clipFunc: (ctx) => {

                    ctx.save();
                    ctx.translate(fakeShape.x(), fakeShape.y())
                    ctx.rotate(Konva.getAngle(fakeShape.rotation()))
                    ctx.rect(0, 0, fakeShape.width() * fakeShape.scaleX(), fakeShape.height() * fakeShape.scaleY());
                    ctx.restore()

                },
                textId: TextClone.id()
            });
            groupImage.add(TextClone);
            layer.add(groupImage);
            groupImage.moveUp();
        } else {
            var groupImage1 = new Konva.Group({ textId: TextClone.id() })
            groupImage1.add(TextClone);
            layer.add(groupImage1);
        }


        groupTrans.moveToTop();
        TextClone.fire('click');
        updatePos();
        TextClone.zIndex(texto.zIndex() + 1);
        layer.draw();


    });
    moveDown.on("click tap", function () {

        var texto = transformer.nodes()[0];
        var textGroup = layer.find(node => {
            return node.getAttr("textId") === texto.id();
        });
        if (textGroup) {
            texto = textGroup[0];

        }

        var background = stage.find(".background")[0];
        if (background) {
            if (background.id() != 1) {

                if ((texto.zIndex()) == background.zIndex() + 1) {


                } else {
                    texto.moveDown();

                    rect1.moveToBottom();

                    layer.draw();
                }
            } else {

                texto.moveDown();

                rect1.moveToBottom();

                layer.draw();

            }
        } else {

            texto.moveDown();

            rect1.moveToBottom();

            layer.draw();
        }
    });
    deleteButton.on('click tap', function () {

        var texto = transformer.nodes()[0];

        var fakeShapeId = texto.getAttr('fakeShapeId');

        texto.destroy();
        if (fakeShapeId != "stage") {

            var camera = layer.find(node => {
                return node.getAttr("camerafakeShapeId") === fakeShapeId;
            });

            var image = layer.find(node => {
                return node.getAttr("fakeShapeId") === fakeShapeId;
            });

            if (image[0]) {

                camera.hide();
            } else {
                camera.show();
                stage.find("#" + fakeShapeId)[0].listening(true);
                stage.find("#" + fakeShapeId)[0].show();
            }

        }

        transformer.nodes([]);
        layer.draw();
        if ($("#input-edit-id").val() == texto.id()) {
            $("#draggable").hide();
        }
    });
    editButton.on('click tap', function () {
        var texto = transformer.nodes()[0];

        if (texto.name() == "image0") {
            $("#image-id").val(texto.id())

            $("#widget-image-edit").show();

        } else {
            generateTextWidget(texto);

            $("#draggable").show();

        }

    });
    deleteButton.on('mouseover', function () {
        
    });
    editButton.on('mouseover', function () {
        
    });
    moveUp.on('mouseover', function () {
        
    });
    moveDown.on('mouseover', function () {
        
    });
    sizeButton.listening(false);

    buttonObj.src = "images/move-up.png";
    buttonObj2.src = "images/move-down.png";

    imageObj1.src = "images/x-png-icon-8.png?32";
    imageObj2.src = "images/size-icon.png";
    copybtnObj.src = "images/btn-copy.png";
    imageObj3.src = "images/edit-icon.png";
    transformer.add(deleteButton);
    transformer.add(sizeButton);
    transformer.add(editButton);
    transformer.add(buttonCopy);
    transformer.add(moveUp);
    transformer.add(moveDown);
    transformer.rotationSnaps([0, 90, 180, 270]);
    return transformer;
}

function addBackground(orientacao, png, texto, product_id, image, circle, fakeshape) {
    var width;
    var height;
    if (orientacao == 1) {
        $("[name2=Deitado]").click();
        width = stageHeight;
        height = stageWidth;
        $("[name2=Deitado]").next("span").addClass("active");
        $("[name2=Deitado]").next("span").show();
        $('[name2="Em pé"]').next("span").hide();
    } else {
        $('[name2="Em pé"]').click();
        height = stageHeight;
        width = stageWidth;
        $('[name2="Em pé"]').next("span").addClass("active");
        $('[name2="Em pé"]').next("span").show()
        $('[name2="Deitado"]').next("span").hide();
    }
    $(".editor").LoadingOverlay("show", {
        background: "rgba(0, 0, 0, 0.9)",
        imageColor: '#FFFFFF'
    });
    $(".editor").LoadingOverlay("show");

    cleanStage();
    var imageObj = new Image();
    imageObj.src = image;

    imageObj.onload = function () {
        var image = new Konva.Image({
            x: 0,
            y: 0,
            width: width,
            height: height,
            image: imageObj,
            draggable: false,
            listening: false
        });
        image.listening(false);
        var groupBackground = new Konva.Group({
            name: 'background',
            id: png,
        })
        groupBackground.add(image);
        layer.add(groupBackground)
        if (texto == 1) {
            $.ajax({
                url: 'index.php?route=product/product/getText',
                type: 'get',
                data: { id: product_id },
                dataType: 'json',
                beforeSend: function () {
                    $(".editor").LoadingOverlay("show");
                },
                complete: function (json) {

                },
                success: function (json) {
                    $(json['success']).each(function (index, value) {
                        createText(value.texto, value.cor, value.posx, value.posy, value.font, value['font_size'], circle, value.textDecoration, value.align, value.fontStyle, value.scalex, value.scaley, value.rotation, value.width);
                    });
                }


            });

        }
        if (fakeshape == 1) {
            $("#widget-image").hide();
            $.ajax({
                url: 'index.php?route=product/product/getFakeShape',
                type: 'get',
                data: { id: product_id },
                dataType: 'json',
                beforeSend: function () {
                    $(".editor").LoadingOverlay("show");
                },
                complete: function (json) {

                },
                success: function (json) {
                    $(json['success']).each(function (index, value) {
                        addFakeShape(parseFloat(value.width), parseFloat(value.height), parseFloat(value.posx), parseFloat(value.posy), parseFloat(value.scalex), parseFloat(value.scaley), png, parseFloat(value.rotation));
                    });
                }
            });

        } else {
            $("#widget-image").show();
        }


        layer.draw();

        setTimeout(function () {
            layer.draw();
            $(".editor").LoadingOverlay("hide", true);
        }, 2000);
    }
}
var color;
var size;
$("#draw").on("click",function(){
    $(this).css('background-color',"#192B49");
    color = $("#paint-color").val();
    size = $("#size").val();
    if(!drawMode){
        drawMode = true;
        var editor = $(".editor");
        document.body.style.cursor = 'url(images/brush.cur)';
    $("#widget-draw").css("top", editor.offset().top+50);
    $("#widget-draw").css("left", editor.offset().left);
    $("#widget-draw").show();
    }else{
        $(this).css('background',"transparent");
        $("#widget-draw").hide();
        drawMode = false;
    }
        
});
$("#paint-color,#size").on('input', function(){
    color = $("#paint-color").val();
    size = $("#size").val();

 
})


$('.editor').on("mousemove", function (event) {
    $("#widget-image-zoom").css("pointer-events", 'none');
    var relX = event.pageX - $('.editor').offset().left + 100;
    var relY = event.pageY - $('.editor').offset().top + 200;
    $("#widget-image-zoom").css("top", relY + "px");
    $("#widget-image-zoom").css("left", relX + "px");
});
