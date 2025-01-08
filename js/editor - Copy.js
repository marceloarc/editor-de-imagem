let isMousePressed = false;
const alignments = ["left", "center", "right", "justify"]; // Ordem dos alinhamentos
let currentIndex = 0; // Índice atual do alinhamento
const icons = ["fa-align-left", "fa-align-center", "fa-align-right", "fa-align-justify"];
const alignmentIcons = {
    left: "fa-align-left",
    center: "fa-align-center",
    right: "fa-align-right",
    justify: "fa-align-justify"
  };
// Detecta quando o mouse ou touch é pressionado
$(document).on('mousedown touchstart', function () {
    isMousePressed = true;
});

// Detecta quando o mouse ou touch é liberado
$(document).on('mouseup touchend', function () {
    isMousePressed = false;
});
$(document).ready(function () {
    $(".close").on('click', function (e) {
        $(this).closest(".widget").hide();
    });
    var movedLayerId = null;  // Variável para armazenar o item original
    $('#layers').sortable({
        items: '.layer',  // Só permite o arraste dos itens com a classe .layer
        placeholder: 'ui-sortable-placeholder', // Estilo do espaço reservado
        forcePlaceholderSize: true,
        axis: 'y',
        start: function(event, ui) {
           
            // originalIndexBefore = ui.item.index();
            movedLayerId = ui.item.attr('layer-id');
            const layersOrder = $('#layers .layer'); // Captura a nova ordem dos botões
            layersOrder.each(function (index, value) {
                $(value).removeClass("active"); // Converte 'value' para um objeto jQuery antes de chamar removeClass
            });
            ui.item.addClass("active");
            $("#currentLayer").val(movedLayerId);
            setActiveLayer(movedLayerId)
            // movedLayer = stage.findOne(`#${movedLayerId}`);
        },

        update: function (event, ui) {
            const layersOrder = $('#layers .layer'); // Captura a nova ordem dos botões
            layersOrder.each(function (index) {
                const layerId = $(this).attr('layer-id'); // Pega o ID da camada associada
                const layer = stage.findOne(`#${layerId}`); // Encontra a camada no palco do Konva
                
                if (layer) {
                    layer.zIndex(index); // Atualiza o zIndex baseado no novo índice
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
            const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

            if (parentLayer.id() !== $("#currentLayer").val()) {
                return;
            }
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
            $('#selectedNode').val(e.target.id())
            $("#widget-image").fadeIn(100);
            
            var imagePosition = image.absolutePosition();

            var stagePosition = $(".konvajs-content").position();
            var widget = document.getElementById('widget-image');
            widget.style.display = 'block';

            var positionTop = stagePosition.top + imagePosition.y + ((image.height() *image.getAbsoluteScale().y) + 50);
            var positionLeft = stagePosition.left + imagePosition.x + ((image.width() / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
            widget.style.position = 'absolute';
            widget.style.top = positionTop + 'px';
            widget.style.left = positionLeft + 'px';
            widget.style.display = "inline !important";
            limit.show();
            updatePos();
            layer.draw();
        });
        image.on('dragstart transformstart', (e) => {
            const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

            if (parentLayer.id() !== $("#currentLayer").val()) {
                return;
            }
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
            $('#selectedNode').val(e.target.id())
            $("#widget-image").fadeOut(100);
            limit.show();
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
                $("." + attr).text(porcentagem+"%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
            $("#widget-image").fadeIn(100);
            
            var imagePosition = image.absolutePosition();

            var stagePosition = $(".konvajs-content").position();
            var widget = document.getElementById('widget-image');
            widget.style.display = 'block';

            var positionTop = stagePosition.top + imagePosition.y + ((image.height() *image.getAbsoluteScale().y) + 50);
            var positionLeft = stagePosition.left + imagePosition.x + ((image.width() / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
            widget.style.position = 'absolute';
            widget.style.top = positionTop + 'px';
            widget.style.left = positionLeft + 'px';
            widget.style.display = "inline !important";

            layer.draw();
        });

        image.on('dragend', (e) => {
            const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

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
            $("#widget-image").fadeIn(100);
            
            var imagePosition = image.absolutePosition();

            var stagePosition = $(".konvajs-content").position();
            var widget = document.getElementById('widget-image');
            widget.style.display = 'block';

            var positionTop = stagePosition.top + imagePosition.y + ((image.height() *image.getAbsoluteScale().y) + 50);
            var positionLeft = stagePosition.left + imagePosition.x + ((image.width() / 2) * image.getAbsoluteScale().x) - ((widget.offsetWidth / 2));
            widget.style.position = 'absolute';
            widget.style.top = positionTop + 'px';
            widget.style.left = positionLeft + 'px';
            widget.style.display = "inline !important";

            layer.draw();
        });



        image.on('mouseover', function () {


        });
        image.on('transform', (e) => {
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
        textAreaPosition(Textpre)
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
        
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $('#selectedNode').val(e.target.id())
        $("#draggable").fadeIn(100);
        generateTextWidget(e.target); 
    });
    
    Text.on('dblclick dbltap', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        $('#selectedNode').val(e.target.id())
        textAreaPosition(Text)
    });
    Text.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        transformer.nodes([e.target]);
        groupTrans.moveToTop();
        updatePos();
        $('#selectedNode').val(e.target.id())
        layer.draw();
        $("#draggable").fadeOut(100);
    });
    Text.on('dragend',(e)=>{
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

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

    var positionTop = position.top + textPosition.y + ((Text.height() * Text.getAbsoluteScale().y) + 50);
    var positionLeft = position.left + textPosition.x + ((Text.width() / 2) * Text.getAbsoluteScale().x) - ((toolbox.offsetWidth / 2));
    toolbox.style.position = 'absolute';
    toolbox.style.top = positionTop + 'px';
    toolbox.style.left = positionLeft + 'px';
    toolbox.style.display = "inline !important";        
}
function textAreaPosition(Text){
    var textPosition = Text.absolutePosition();

    var position = $(".konvajs-content").position();
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
        var node = stage.find("#" + $('#bgcolor').attr("object-id"))[0];
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
        var node = stage.find("#" + $('#bgcolor').attr("object-id"))[0];
        node.destroy()
        $("#widget-bg").fadeOut(100);
        layer.draw();
    });
$('#draw-color').on('input',
    function () {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        cor = $('#draw-color').val();
        var node = stage.find("#" + $('#draw-color').attr("object-id"))[0];
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
            var node = stage.find("#" + $('#' + attr).attr("object-id"))[0];
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

   
    var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
    var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
    $("#widget-node").fadeIn(100);
    var widget = document.getElementById('widget-node');
    widget.style.position = 'absolute';
    // Calcular a posição correta no documento
    var positionTop = stagePosition.top + position.y + ((200 * node.getAbsoluteScale().y));
    var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
    
    // Atualizar a posição do widget
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    // Atualizar cor e exibir o widget
    $("#draw-color").attr("disabled", false);
    $("#draw-color").val(node.fill()); // Definir a cor do alvo
    const colorButton = document.getElementById("node-color-button");

    colorButton.style.backgroundColor = node.fill(); 
    $("#draw-color").attr("object-id", node.id());
    $('#selectedNode').val(node.id())

    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function () {
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((200 * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())

    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((200 * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });


    node.on('dragend', (e)=>{
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((200 * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

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

    var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
    var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
    $("#widget-node").fadeIn(100);
    var widget = document.getElementById('widget-node');
    widget.style.position = 'absolute';
    // Calcular a posição correta no documento
    var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y)+20);
    var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2) - (node.width()/2)* node.getAbsoluteScale().x);
    
    // Atualizar a posição do widget
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    // Atualizar cor e exibir o widget
    $("#draw-color").attr("disabled", false);
    $("#draw-color").val(node.fill()); // Definir a cor do alvo
    const colorButton = document.getElementById("node-color-button");

    colorButton.style.backgroundColor = node.fill(); 
    $("#draw-color").attr("object-id", node.id());
    $('#selectedNode').val(node.id())

    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function () {
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y)+20);
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2) - (node.width()/2)* node.getAbsoluteScale().x);
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())

    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y)+20);
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2) - (node.width()/2)* node.getAbsoluteScale().x);
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });


    node.on('dragend', (e)=>{
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((200 * node.getAbsoluteScale().y)+20);
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2) - (node.width()/2)* node.getAbsoluteScale().x);
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

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

$("#add-bg").on('click', function(){
    var layer = stage.findOne("#"+$("#currentLayer").val());
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
        $("#widget-bg").fadeIn(100);
        var position = $(".konvajs-content").position();
        var widget = document.getElementById('widget-bg');
        var positionTop = position.top + stage.height()+10;
        var positionLeft = position.left + (stage.width() / 2 - (widget.offsetWidth / 2));
        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';

        // Mostrar widget ao clicar
        var widget = document.getElementById('widget-bg');
        widget.style.display = "block";
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

    var position = node.getAbsolutePosition();
    var stagePosition = $(".konvajs-content").offset(); 
    $("#widget-node").fadeIn(100);
    var widget = document.getElementById('widget-node');
    widget.style.position = 'absolute';
    // Calcular a posição correta no documento
    var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y));
    var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
    
    // Atualizar a posição do widget
    widget.style.top = positionTop + 'px';
    widget.style.left = positionLeft + 'px';
    // Atualizar cor e exibir o widget
    $("#draw-color").attr("disabled", false);
    $("#draw-color").val(node.fill()); // Definir a cor do alvo
    const colorButton = document.getElementById("node-color-button");

    colorButton.style.backgroundColor = node.fill(); 
    $("#draw-color").attr("object-id", node.id());
    $('#selectedNode').val(node.id())

    node.on('transformstart', function () {
        $("#widget-node").fadeOut(100);
    })

    node.on('transform', function () {
        updatePos();
    })
    node.on('transformend', function () {
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())

    })

    node.on('mouseover', function () {

    });

    node.on('mousedown touchstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

        if (parentLayer.id() !== $("#currentLayer").val()) {
            return;
        }
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x  - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });


    node.on('dragend', (e)=>{
        var position = node.getAbsolutePosition(); // Posição absoluta do nó dentro do Stage
        var stagePosition = $(".konvajs-content").offset(); // Deslocamento do container Konva no documento
        $("#widget-node").fadeIn(100);
        var widget = document.getElementById('widget-node');
        widget.style.position = 'absolute';
        // Calcular a posição correta no documento
        var positionTop = stagePosition.top + position.y + ((node.height() * node.getAbsoluteScale().y));
        var positionLeft = stagePosition.left + position.x - ((widget.offsetWidth / 2));
        
        // Atualizar a posição do widget
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';
        // Atualizar cor e exibir o widget
        $("#draw-color").attr("disabled", false);
        $("#draw-color").val(node.fill()); // Definir a cor do alvo
        const colorButton = document.getElementById("node-color-button");

        colorButton.style.backgroundColor = node.fill(); 
        $("#draw-color").attr("object-id", node.id());
        $('#selectedNode').val(node.id())
    });

    node.on('dragstart', (e) => {
        const parentLayer = e.target.getLayer(); // Camada à qual o objeto pertence

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
    var deleteButton = stage.find(".button-delete")[0];
    var sizeButton = stage.find(".button-size")[0];
    var rotateButton = stage.find(".button-edit")[0];
    var buttonCopy = stage.find(".button-copy")[0];
    deleteButton.position({
        x: transformer.findOne('.top-left').position().x - 20,
        y: transformer.findOne('.top-left').position().y - 20
    });
    sizeButton.position({
        x: transformer.findOne('.bottom-right').position().x - 5,
        y: transformer.findOne('.bottom-right').position().y - 5
    });
    rotateButton.position({
        x: transformer.findOne('.top-center').position().x -8,
        y: transformer.findOne('.top-center').position().y - 58
    });

    buttonCopy.position({
        x: transformer.findOne('.bottom-left').position().x - 20,
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
    stage.find('.image').destroy();
    stage.find('Circle').destroy();
}
var transformer;
var limit;
var limitGroup;
var stageWidth;
var stageHeight;
var stage;
var tr;
var layer;
var rect1;
var group;
var deleteButton;
var rotateButton;
var sizeButton;
var buttonCopy;
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
    
    
    rect1 = new Konva.Rect({
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,
        id: "background1",
        name:"background",
        fill: $('#bgcolor').val(),
    });

    $('#bgcolor').attr("object-id", rect1.id());
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

    rect1.on("mousedown touchstart", function() {
        if(!drawMode){
            $("#widget-bg").fadeIn(100);
            var position = $(".konvajs-content").position();
            var widget = document.getElementById('widget-bg');
            var positionTop = position.top + stage.height()+10;
            var positionLeft = position.left + (stage.width() / 2 - (widget.offsetWidth / 2));
    
            widget.style.position = 'absolute';
            widget.style.top = positionTop + 'px';
            widget.style.left = positionLeft + 'px';
    
            // Mostrar widget ao clicar
            var widget = document.getElementById('widget-bg');
        }
    });


    var isPaint = false;
    var mode = 'brush';
    var lastLine;
    stage.on('mousedown touchstart', function (e) {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        if (drawMode) {
            if(mode=='brush'){
                $(".editor").css("cursor", "url('images/cursor.cur'), auto")
            }else{
                $(".editor").css("cursor", "url('images/eraser.cur'), auto")
            }

            isPaint = true;

            // Obtém a posição do ponteiro (mouse ou toque)
            var pointerPosition = stage.getPointerPosition();
            if (!pointerPosition) return; // Se não houver posição do ponteiro, não faz nada
        
            // Ajuste a posição do ponteiro com base na escala e no deslocamento do stage
            var scale = stage.scale();
            var stagePosition = stage.position();
            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };
        
            // Cria a linha quando começar o desenho
            lastLine = new Konva.Line({
                points: [adjustedPosition.x, adjustedPosition.y], // Define o ponto inicial
                stroke: 'black',
                strokeWidth: 2,
                stroke: color,
                strokeWidth: size,
                globalCompositeOperation:
                mode === 'brush' ? 'source-over' : 'destination-out',
                lineJoin: 'round',
                lineCap: 'round',
            });
        
            // Adiciona a linha à camada
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
                $(".editor").css("cursor", "")
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
            // Garantir que só desenhe se o usuário estiver realmente desenhando
            if (!isPaint) {
                return;
            }
            e.evt.preventDefault();
            // Obtém a posição do ponteiro (mouse ou toque)
            var pointerPosition = stage.getPointerPosition();
    
            // Se não houver posição do ponteiro, não deve desenhar
            if (!pointerPosition) return;
    
            // Obtém a escala e o deslocamento do stage
            var scale = stage.scale();
            var stagePosition = stage.position();
    
            // Ajusta a posição do ponteiro levando em conta a escala e o deslocamento
            var adjustedPosition = {
                x: (pointerPosition.x - stagePosition.x) / scale.x,
                y: (pointerPosition.y - stagePosition.y) / scale.y
            };

            // Adiciona o ponto à linha
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
    

    stage.on('wheel', (e) => {
        e.evt.preventDefault(); // Impedir que a página role junto
        const zoomScale = 1.05; // Fator de zoom
        const oldScale = stage.scaleX(); // Obter a escala atual
    
        // Determinar direção do scroll
        const delta = e.evt.deltaY;
    
        // Se deltaY for positivo (rolagem para baixo), diminui o zoom
        // Se deltaY for negativo (rolagem para cima), aumenta o zoom
        let newScale = (delta > 0) ? oldScale / zoomScale : oldScale * zoomScale;
    
        // Limitar o zoom para evitar que fique muito pequeno ou muito grande
        if (newScale > 5) newScale = 5;
        if (newScale < 0.1) newScale = 0.1;
    
        // Atualiza a escala do stage
        stage.scale({ x: newScale, y: newScale });
    
        // Calcula a posição do mouse em relação ao stage (para zoom no ponto do mouse)
        const mousePointTo = {
            x: (stage.getPointerPosition().x - stage.x()) / oldScale,
            y: (stage.getPointerPosition().y - stage.y()) / oldScale,
        };
    
        const newPos = {
            x: stage.getPointerPosition().x - mousePointTo.x * newScale,
            y: stage.getPointerPosition().y - mousePointTo.y * newScale,
        };
    
        // Atualiza a posição do stage com o novo valor calculado
        stage.position(newPos);
    
        // Ajusta o tamanho do stage, de acordo com o novo scale
        const parentWidth = stage.width();
        const parentHeight = stage.height();
        const containerWidth = $("#stage-parent").width();
        const containerHeight = $("#stage-parent").height();
    
        // Não queremos que o stage ultrapasse os limites do #stage-parent
        if (stage.x() < 0) stage.x(0); // Limite esquerda
        if (stage.y() < 0) stage.y(0); // Limite superior
    
        if (stage.x() + stage.width() > containerWidth) stage.x(containerWidth - stage.width()); // Limite direita
        if (stage.y() + stage.height() > containerHeight) stage.y(containerHeight - stage.height()); // Limite inferior
    
        updatePos(); // Se necessário, para recalcular outras variáveis
        stage.batchDraw(); // Redesenha o stage após zoom
    });
    stage.on('click tap dragstart', function (e) {

        if ((e.target.name() != 'image') && (e.target.name() != 'button-up') && (e.target.name() != 'draw') && (e.target.name() != 'button-down') && ((e.target.name() != 'text')) && (e.target.name() != 'button-edit') && (e.target.name() != 'button-copy')) {
            limit.hide();
            $("#draggable").fadeOut(100);
            
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
                $("." + attr).text(porcentagem+"%");
                if (e.target.name() === 'image') {
                    $("#" + attr).prop("disabled", false);
                } else {
                    $("#" + attr).prop("disabled", true);
                }
            });
            if(e.target.name() != 'text'){
                $("#draggable").fadeOut(100);
            }
            if((e.target.name() != 'background')|| (drawMode) ){
                $("#widget-bg").fadeOut(100);
            }
            if(e.target.name() != 'draw'){
                $("#widget-node").fadeOut(100);
            }
            if(e.target.name() != 'image'){
                $("#widget-image").fadeOut(100);
            }
            if(e.target.name() != "background")
            {
                transformer.nodes([e.target]);
            }
            
            groupTrans.moveToTop();
            limitGroup.moveToTop();
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
    layer.add(rect1);


    layer.add(group);
    layer.add(limitGroup);
    limit.hide();
    layer.draw();
    updateLayerButtons();
    setInterval(function () {
        if (!isMousePressed) {
            updateLayerButtons();
        }
    }, 1000);


    fitStageIntoParentContainer();
    window.addEventListener('resize', fitStageIntoParentContainer);


    stage.draw();
    $('#zoom-slider').val(stage.scaleX());
    $('#zoom-slider').attr("original-scale",stage.scaleX())

});

function fitStageIntoParentContainer() {
    stageParent = document.getElementById('stage-parent');
    const containerWidth = stageParent.offsetWidth;
    const containerHeight = stageParent.offsetHeight;

    // Calcula escala proporcionalmente ao menor lado (horizontal ou vertical)
    const scaleX = containerWidth / originalStageWidth;
    const scaleY = containerHeight / originalStageHeight;
    const scale = Math.min(scaleX, scaleY);
    $("#zoom-slider").attr("original-scale",scale)
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
        // Obter o texto correspondente ao ID
        var text = stage.find("#" + $("#input-edit-id").val())[0];
        if (!text) return; // Certifique-se de que o texto existe
    
        // Atualizar o alinhamento com base no índice atual
        const newAlignment = alignments[currentIndex];
        text.align(newAlignment);
        layer.draw();
    
        // Atualizar o índice para o próximo alinhamento
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
    if (!$(e.target).closest("#draggable").length && !$(e.target).is("canvas") && !$(e.target).closest("#widget-bg").length && !$(e.target).closest("#widget-node").length && !$(e.target).closest("#widget-image").length) {
        var transformers = stage.find('Transformer');
        if (transformers.length > 0) {
            for (var i = 0; i < transformers.length; i++) {
                transformers[i].nodes([]);
            }
            limit.hide();
            layer.draw();
            $("#draggable").fadeOut(100);
            $("#widget-bg").fadeOut(100);
            $("#widget-node").fadeOut(100);
            $("#widget-image").fadeOut(100);
        }
        
    }
});
function addTransformer() {
    var imageObj1 = new Image();
    var imageObj2 = new Image();
    var imageObj3 = new Image();
    var copybtnObj = new Image();
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
    var deleteButton = new Konva.Image({

        image: imageObj1,
        width: 20,
        height: 20,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-delete'
    });
    var rotateButton = new Konva.Image({

        image: imageObj3,
        width: 20,
        height: 20,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-edit'
    });
    var sizeButton = new Konva.Image({
        width: 20,
        height: 20,
        image: imageObj2,
        stroke: 'gray',
        strokeWidth: 0,
        name: 'button-size'

    });

    var copybtnObj = new Image();
    var buttonCopy = new Konva.Image({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        image: copybtnObj,
        name: 'button-copy',
        draggable: false,
        width: 20,
        height: 20,
        stroke: 'gray',
        strokeWidth: 0,
    });

    buttonCopy.on("click tap", function (e) {
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
        NodeClone.fire('click');
        updatePos();
        NodeClone.zIndex(node.zIndex() + 1);
        layer.draw();

        
    });

    deleteButton.on('click tap', function () {
        var layer = stage.findOne("#"+$("#currentLayer").val());
        var node = transformer.nodes()[0];

        var fakeShapeId = node.getAttr('fakeShapeId');

        node.destroy();
        if (fakeShapeId != "stage") {

            var camera = layer.find(nd => {
                return nd.getAttr("camerafakeShapeId") === fakeShapeId;
            });

            var image = layer.find(nd => {
                return nd.getAttr("fakeShapeId") === fakeShapeId;
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
        if ($("#input-edit-id").val() == node.id()) {
            $("#draggable").fadeOut(100);
        }
        $("#widget-image").fadeOut(100);
        $("#widget-node").fadeOut(100);
    });

    deleteButton.on('mouseover', function () {

    });
    rotateButton.listening(false);

    sizeButton.listening(false);



    imageObj1.src = "images/x-png-icon-8.png?32";
    imageObj2.src = "images/size-icon.png";
    copybtnObj.src = "images/btn-copy.png";
    imageObj3.src = "images/edit-icon.png";
    transformer.add(deleteButton);
    transformer.add(sizeButton);
    transformer.add(rotateButton);
    transformer.add(buttonCopy);
    transformer.rotationSnaps([0, 90, 180, 270]);

    return transformer;
}

function addBackground(orientacao, png, texto, product_id, image, circle, fakeshape) {
    var width;
    var height;
    var layer = stage.findOne("#"+$("#currentLayer").val());
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
$("#draw").on("click", function () {
    sliders.forEach(function (attr) {
        $("#" + attr).prop("disabled", true);
    });
    $(this).css('background-color', "#424344");
    $(".editor").css("cursor", "url('images/cursor.cur'), auto")
    color = $("#brush-color").val();
    size = $("#brush-size").val();
    $("#brush-size-text").text(size);
    if (!drawMode) {
        drawMode = true;
        $("#widget-draw").fadeIn(100);
        $(".draw-mode[draw-mode='brush']").addClass("active");
        const colorButton = document.getElementById("brush-color-button");

        colorButton.style.backgroundColor = color; 
        var position = $(".konvajs-content").position();
        var widget = document.getElementById('widget-draw');
        var positionTop = position.top + stage.height()+10;
        var positionLeft = position.left + (stage.width() / 2 - (widget.offsetWidth / 2));

        widget.style.position = 'absolute';
        widget.style.top = positionTop + 'px';
        widget.style.left = positionLeft + 'px';

        // Mostrar widget ao clicar
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
    
    $("#brush-size-text").text(size);

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
        
            const isChecked = layer.visible() ? "checked" : ""; // Verifica se o layer está visível
        
            const buttonHtml = `
                <li class="layer" layer-id="${layerId}">
                    <img src="${imgsrc}" class="layer-img" alt="Layer Image" style="width: 70px; height: 43px;">
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
            // Ativar eventos para a camada selecionada
            layer.listening(true);
        } else {
            // Desativar eventos para as outras camadas
            layer.listening(false);
        }
    });
}
// Clique no botão da camada
$('#layers').on('click', '.layer', function (e) {
    // Ignora o clique caso seja no checkbox para evitar conflito
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

$(".moveUp").click(function()
{
    var layer = stage.findOne("#"+$("#currentLayer").val());
    var node = stage.find("#" + $('#selectedNode').val())[0];

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
    var node = stage.find("#" + $('#selectedNode').val())[0];

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
    const newScale = parseFloat($(this).val());

    // Obtém o centro do palco
    const stageCenter = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };

    // Converte o centro do palco para as coordenadas do conteúdo
    const stagePosition = stage.position();
    const currentScale = stage.scaleX();
    const centerPointTo = {
        x: (stageCenter.x - stagePosition.x) / currentScale,
        y: (stageCenter.y - stagePosition.y) / currentScale,
    };

    // Atualiza o scale do stage
    stage.scale({ x: newScale, y: newScale });

    // Ajusta a nova posição do stage para manter o zoom centralizado
    const newPosition = {
        x: stageCenter.x - centerPointTo.x * newScale,
        y: stageCenter.y - centerPointTo.y * newScale,
    };
    stage.position(newPosition);

    var layer = stage.findOne("#"+$("#currentLayer").val());
    var background = stage.find('.background');
    if (background) {
        background.forEach(bg => {
            const scale = stage.scaleX(); // Supõe que scaleX e scaleY sejam iguais
            const position = stage.position(); // Pega o deslocamento do stage
        
            // Calcula o tamanho e posição do fundo ajustados ao zoom
            bg.width(stage.width() / scale);
            bg.height(stage.height() / scale);
            bg.x(-position.x / scale);
            bg.y(-position.y / scale);
        
            layer.draw(); // Redesenha a camada para aplicar as alterações
        });
    }

    // Redesenha o palco
    stage.batchDraw();
});

// Botão para redefinir o zoom
$('#reset-zoom').on('click', function () {
    stage.scale({ x: $("#zoom-slider").attr("original-scale"), y: $("#zoom-slider").attr("original-scale") });
    stage.position({ x: 0, y: 0 });

    var layer = stage.findOne("#"+$("#currentLayer").val());
    var background = stage.find('.background');
    if (background) {
        background.forEach(bg => {
            const scale = stage.scaleX(); // Supõe que scaleX e scaleY sejam iguais
            const position = stage.position(); // Pega o deslocamento do stage
        
            // Calcula o tamanho e posição do fundo ajustados ao zoom
            bg.width(stage.width() / $("#zoom-slider").attr("original-scale"));
            bg.height(stage.height() / $("#zoom-slider").attr("original-scale"));
            bg.x(-0 / $("#zoom-slider").attr("original-scale"));
            bg.y(-0 / $("#zoom-slider").attr("original-scale"));
        
            layer.draw(); // Redesenha a camada para aplicar as alterações
        });
    }
    stage.batchDraw();
    $('#zoom-slider').val($("#zoom-slider").attr("original-scale")); // Sincroniza o slider

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
$("#new-image").click(function(){
    const userWidth = parseInt(prompt('Digite a largura do canvas:', 800));
    const userHeight = parseInt(prompt('Digite a altura do canvas:', 600));

    if (userWidth > 0 && userHeight > 0) {
        setNewCanvasSize(userWidth, userHeight);
    }
})
function setNewCanvasSize(userWidth, userHeight) {
    // Atualiza stage com novo tamanho original
    originalStageWidth = userWidth;
    originalStageHeight = userHeight;
    stageWidth = userWidth
    stageHeight = userHeight;
    stage.width(userWidth);
    stage.height(userHeight);
    stage.batchDraw();
    // Ajustar ao contêiner enquanto mantém escala
    fitStageIntoParentContainer();
    adjustContainerToFitStage('#stage-parent', userWidth, userHeight); // Ajusta o contêiner
}
function adjustContainerToFitStage(containerId, stageWidth, stageHeight) {
    const container = document.querySelector(containerId);
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaleX = containerWidth / originalStageWidth;
    const scaleY = containerHeight / originalStageHeight;
    const scale = Math.min(scaleX, scaleY); 
    // Ajusta o tamanho do contêiner ao tamanho do stage
    container.style.width = `${stageWidth * scale}px`;
    container.style.height = `${stageHeight * scale}px`;

    // Verifica se o stage ultrapassa as dimensões do navegador
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adiciona scroll se o stage for maior que o viewport
    container.style.overflowX = stageWidth > viewportWidth ? 'auto' : 'hidden';
    container.style.overflowY = stageHeight > viewportHeight ? 'auto' : 'hidden';

    // Opcional: centraliza o contêiner no viewport

}
function saveImageOriginalScale() {
    // Temporariamente redefina para escala original
    const currentScale = stage.scaleX(); // Supondo que scaleX = scaleY
    stage.scale({ x: 1, y: 1 });
    stage.width(originalStageWidth);
    stage.height(originalStageHeight);
    stage.batchDraw();

    // Exporta o conteúdo do stage
    const dataURL = stage.toDataURL();

    // Restaure o estado do stage para o ajuste de contêiner
    fitStageIntoParentContainer();

    // Opcional: download da imagem
    const link = document.createElement('a');
    link.download = 'stage-image.png';
    link.href = dataURL;
    link.click();
}