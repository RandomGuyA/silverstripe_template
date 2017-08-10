;(function ($, doc, win) {
    "use strict";


    //--------------------------------------//
    //              GLOBALS
    //--------------------------------------//

    var name = 'navigation';
    var ID = 674154;


    $.navigation = function (element, options) {


        //--------------------------------------//
        //       DEFAULT PLUGIN SETTINGS
        //--------------------------------------//

        var defaults = {

            required: true,

            animation_speed: 1000

        };


        //--------------------------------------//
        //       PLUGIN PRIVATE VARIABLES
        //--------------------------------------//

        var plugin = this; //use plugin instead of "this"
        var id = ID;  //set unique ID for plugin instance


        //--------------------------------------//
        //       CUSTOM SETTING SETUP
        //--------------------------------------//


        plugin.settings = {}; //initialise empty settings object

        var $element = $(element),  // reference to the jQuery version of DOM element the plugin is attached to
            element = element;        // reference to the actual DOM element

        //gather individual plugin defaults from the attr tags in the plugin element
        //example attribute: <div data-{plugin name}-opts='{"custom_variable":"value"}' />*
        var meta = $element.data(name + '-opts');

        var $links = $element.find('a');
        var $li_tabs = $element.find('li');

        var $parent_links = $element.find('.parent');
        var $child_links = $element.find('.child');

        var $hamburger = $element.find('.glyphicon-menu-hamburger');


        //--------------------------------------//
        //              CONSTRUCTOR
        //--------------------------------------//

        plugin.init = function () {

            // the plugin's final properties are the merged default and user-provided options (if any)
            plugin.settings = $.extend({}, defaults, options, meta);

            console.log("initialised plugin " + name + " -- " + id);

            setup_viewport();
            nav_adjust();

        };


        //--------------------------------------//
        //              PUBLIC METHODS
        //--------------------------------------//

        /**
         *  these methods can be called like:
         *  plugin.methodName(arg1, arg2, ... argn) from inside the plugin or
         *  element.data('pluginName').publicMethod(arg1, arg2, ... argn) from outside the plugin, where "element"
         *  is the element the plugin is attached to;
         */

        plugin.margin_adjust = function () {

            setup_viewport();

        };


        //--------------------------------------//
        //              PRIVATE METHODS
        //--------------------------------------//
        /**
         *  these methods can be called only from inside the plugin like:
         *  methodName(arg1, arg2, ... argn)
         */

        var setup_viewport = function () {

            console.log('Margin adjustment');
            var delta = 10;
            var offset = $element.width() + 20;

            if ($(window).width() < 1160 && $(window).width() > 599) {
                if ($element.hasClass('open')) {

                    $('.main').css('margin-left', offset + "px");
                    $('.main').css('margin-right', delta + "px");

                } else if ($element.hasClass('closed')) {

                    $('.main').css('margin-left', 60 + "px");
                    $('.main').css('margin-right', delta + "px");

                }
            }else if ($(window).width() < 600) {

                $('.main').css('margin-left', 60 + "px");
                $('.main').css('margin-right', delta + "px");

            }else {

                $('.main').css('margin-left', offset + "px");
                $('.main').css('margin-right', offset + "px");

            }
        };

        var nav_adjust = function(){

            $element.on('load', function(){
               console.log('loaded');
            });

            if($element.hasClass('closed')) {
                var offset = $element.width() - 40;
                //console.log(offset);

                $element.css("left", "-" + offset + "px");
            }
        };

        //--------------------------------------//
        //    CUSTOM BINDING EVENTS
        //--------------------------------------//

        /**
         *    Add custom methods to selectors
         *    These are called by adding the function to the selectors
         *    eg: $('.element).bind_event(args);
         */

        $.fn.bind_events = function (args) {
            // code goes here
        };


        $(window).on('resize', function () {
            setup_viewport();
        });


        $parent_links.find('a').on('click', function(){

            var $parent_el = $(this).parent();
            /*
            if($parent_el.hasClass('child')){
                console.log($(this).parent()[0]);
                $child_links.removeClass('current');
                $parent_el.addClass('current');

            }else{
                $child_links.removeClass('current');
                $parent_links.removeClass('section');
                $parent_el.addClass('section');
            }*/
            nav_adjust();
        });


        $hamburger.on('click', function () {

            if ($element.hasClass('open')) {

                //close the menu

                console.log($element.width());

                var offset = $element.width() - 40;

                if ($(window).width() < 1160) {
                    if ($element.hasClass('open')) {

                        $('.main').animate({
                            'margin-left':  60 + "px",
                        }, plugin.settings.animation_speed, function () {
                            // Animation complete.

                            $('.content-slider').data('content_slider').update();

                        });
                    }
                }

                $element.animate({
                    left: "-" + offset + "px",
                }, plugin.settings.animation_speed, function () {
                    // Animation complete.
                    $element.removeClass('open');
                    $element.addClass('closed');

                });


            } else if ($element.hasClass('closed')) {

                //open the menu

                $element.animate({
                    left: "0",
                }, plugin.settings.animation_speed, function () {
                    // Animation complete.
                    $element.removeClass('closed');
                    $element.addClass('open');

                });
            }
        });


        //-----------------------------------------
        //				INITIALISATION
        //-----------------------------------------

        plugin.init();


    };


    //-----------------------------------------
    //				INVOCATION
    //-----------------------------------------

    /**
     *  element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
     *  element.data('pluginName').settings.propertyName
     *
     */

    $.fn.navigation = function (options) {
        return this.each(function () {
            if (undefined == $(this).data(name)) {
                var plugin = new $.navigation(this, options);
                $(this).data(name, plugin);
            }
        });
    };
})(jQuery, document, window);