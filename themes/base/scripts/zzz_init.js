$(document).ready(function () {
    setup_home_page_menu_tabs();
    scroll_event_listener();
});

$(window).on('resize', function () {

    vertical_align_text_in_image($('.js-abs-center'));
    update_home_page_menu_tabs();
});

var vertical_align_text_in_image = function ($text) {

    $text.each(function () {

        var not_loaded = false;
        var text = $(this);
        var parent_container = $(this).parent();
        var img = parent_container.find('img');

        img.each(function(){
            var height = $(this).height();
            if (height != 0) {
                text.css('line-height', $(this).height() + "px");
            }else{
                not_loaded = true;
            }
        });
        if (not_loaded) {
            img.on('load', function () {
                var height = $(this).height();

                if (height != 0) {
                    text.css('line-height', $(this).height() + "px");
                }
            });
        }
    });
};

var setup_home_page_menu_tabs = function () {

    var $home_tab_images = $('.home-page-menu li');

    $home_tab_images.each(function () {

        var $tab = $(this);

        var tab_height = $tab.height();
        $tab.find('a').css('line-height', tab_height + "px");

        var $image = $(this).find('img');

        $image.on('load', function () {

            var img = Box($image.width(), $image.height());
            var tab = Box($tab.width(), $tab.height());
            check_sizes(img, $image, tab);

        });
    });
};

var check_sizes = function (img, $image, tab) {
    if (img.width < tab.width) {
        $image.css({'width': '120%', 'height': 'auto'});
    } else if (img.height < tab.height) {
        $image.css({'width': 'auto', 'height': '120%'});
    }
};

var update_home_page_menu_tabs = function () {
    var $home_tab_images = $('.home-page-menu li');

    $home_tab_images.each(function () {

        var $tab = $(this);

        var tab_height = $tab.height();
        $tab.find('a').css('line-height', tab_height + "px");

        var $image = $(this).find('img');

        var img = Box($image.width(), $image.height());
        var tab = Box($tab.width(), $tab.height());

        check_sizes(img, $image, tab);
    });
};

var Box = function (width, height) {

    return {
        width: width,
        height: height
    }
}

function find_parent(className, element) {

    var parent = element.parent();

    if ($(parent).hasClass(className)) {
        return $(parent);
    } else {
        return find_parent(className, $(parent));
    }
}

var update_footer = function(){

    var $footer = $('.js-footer');
    var height = $footer.outerHeight();
    var scroll_height = $(document).height() - $(window).height();
    if ($(window).scrollTop() == scroll_height ) {
        $footer.animate({
            bottom:'0px'
        }, 500, function() {
            $footer.addClass('active');
        });
    }
    if($footer.hasClass('active')){
        if ($(window).scrollTop() != scroll_height) {
            $footer.removeClass('active');
            $footer.animate({
                bottom:'-'+height+'px'
            }, 500, function() {

            });
        }
    }


};

var scroll_event_listener = function(){

    $(window).scroll(function(){
        update_footer();
    });

};
