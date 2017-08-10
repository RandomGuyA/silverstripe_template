;

/** AJAX TRANSITION MANAGER PLUGIN
 *
 *  Author: Byron Morley
 *  updated: 13/03/17
 *  VERSION 2.0
 *
 */

/**     HOW TO USE
 *
 *      Create Folder 'Ajax' in templates
 *
 *      each unique page will require an ajax version and a static template version
 *
 *      Insert the following function into each unique page controller
 *
 *      public function index()
 {

     if (Director::is_ajax()) {
         return $this->renderWith("Ajax/" . $this->ClassName);
     } else {
         return $this->render();
     }
 }
 *
 *
 *
 *      Add this wrapper to each of the ajax pge templates and place the content inside the animation layer
 *
 *      <div class="trans-page-info" class="no-display" dec="<% if $Transition_dec %>$Transition_dec<% else %>slide-right<% end_if %>" inc="<% if $Transition_inc %>$Transition_inc<% else %>slide-left<% end_if %>"></div>
 <div class="animation-layer anim-leave" id="ajax-source">
 </div>
 <div class="animation-layer anim-enter" sort="$Sort">

 <!-- CONTENT GOES HERE -->

 </div>
 *
 *
 *
 *      Add this script to the page template, changing the root value accordingly
 *
 *      <script>

 $(document).ready(function () {
                $('#ajax-plugin-area').ajax_plugin({

                    child_list: $('#ajax-child-list'),
                    ajax_container: 'ajax-container',

                    nav_next_frame: 'next-arrow',
                    nav_prev_frame: 'back-arrow',
                    root: 'atebol-interactive',

                    initialise_javascript_dependencies: function () {

                    }
                });
            });
 </script>
 *
 */


;(function ($, doc, win) {
    "use strict";


    //--------------------------------------//
    //              GLOBALS
    //--------------------------------------//

    var name = 'ajax_plugin_version_3.0';

    $.ajax_plugin = function (element, options) {

        //--------------------------------------//
        //       DEFAULT PLUGIN SETTINGS
        //--------------------------------------//

        var defaults = {

            //Div Classes and IDs

            ajax_link_class: 'ajax-link',
            ajax_container: 'ajax-container',
            animation_layer: 'animation-layer',
            source_id: 'ajax-source',
            animation_enter: 'anim-enter',
            animation_leave: 'anim-leave',

            plugin_page_class_name: 'Unit',
            birds_nest_class: 'birds-nest',
            //Callbacks

            initialise_javascript_dependencies: null,
            load_page_callback: null,
            page_loaded_callback: null,
            start_animation_callback: null,
            end_animation_callback: null,

            //navigation divs

            child_list: null,
            nav_next_frame: null, //class of the a tag for next nav
            nav_prev_frame: null,  //class of the a tag for next nav

            url: null,
            abs_link: null,
            root: null,

            freezable_content: []

        };


        //--------------------------------------//
        //       PLUGIN PRIVATE VARIABLES
        //--------------------------------------//

        var plugin = this; //use plugin instead of "this"


        var $child_list;
        var child_count;
        var $nav_next_frame;
        var $nav_prev_frame;
        var $container;

        var page_loading = false;
        var animate_transition = false;
        var internal_call = false;

        var url_destination;
        var page_list;

        var current_page;
        var url_object;

        var transition_spool = [];
        var previous_page;
        var destination_page;
        var clicked = false;


        var interval;

        //--------------------------------------//
        //       CUSTOM SETTING SETUP
        //--------------------------------------//


        plugin.settings = {}; //initialise empty settings object

        var $element = $(element),  // reference to the jQuery version of DOM element the plugin is attached to
            element = element;        // reference to the actual DOM element

        //gather individual plugin defaults from the attr tags in the plugin element
        //example attribute: <div data-{plugin name}-opts='{"custom_variable":"value"}' />*
        var meta = $element.data(name + '-opts');


        //--------------------------------------//
        //              CONSTRUCTOR
        //--------------------------------------//

        plugin.init = function () {

            // the plugin's final properties are the merged default and user-provided options (if any)
            plugin.settings = $.extend({}, defaults, options, meta);
            console.log("initialised plugin " + name);
            $element.css('position', 'relative');
            add_ajax_links();

            $container = $('.' + plugin.settings.ajax_container);
            if (plugin.settings.child_list) {
                setup_child_list();
            } else {
                console.log('no child list found');
            }
            init_ajax_call();
        };

        plugin.get_current_index = function () {
            return current_page;
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

        //--------------------------------------//
        //              PRIVATE METHODS
        //--------------------------------------//
        /**
         *  these methods can be called only from inside the plugin like:
         *  methodName(arg1, arg2, ... argn)
         */

        var init_ajax_call = function () {

            if (internal_call) {
                previous_page = destination_page;
            }
            destination_page = get_destination_page();
            if (internal_call) {
                destination_page.previous_page = destination_page;
            }

            var page = (internal_call) ? destination_page : get_root_nest_page(destination_page);

            evaluate_page(page);
            transition_spool.reverse();
            update_and_check_transition_spool();
        };

        var navigate_to_url = function ($that) {

            if (!page_loading) {
                if (!clicked) {
                    clicked = true;
                    var url = $that.attr('href');

                    if (!link_is_current_page(window.location.href, url)) {

                        set_internal_call(url);

                        var scrollTop = $('body').scrollTop();

                        if (scrollTop > 0) {
                            $("body").animate({scrollTop: "0px"}, scrollTop / 2, function () {
                                init_ajax_call();
                            });
                        } else {
                            init_ajax_call();
                        }
                    }
                }
            }
        };

        var evaluate_page = function (page) {

            //console.log("page name "+ page.navigate_to_child);

            var child_page;
            if (page.navigate_to_child != undefined) {
                child_page = page.navigate_to_child;
                page.navigate_to_child = undefined;
            } else {
                //console.log("get child page");
                child_page = get_first_child(page);
            }

            if (page.nest == 0 || page.nest == undefined) {
                page.containerID = $container.attr('id');
                transition_spool.push(create_transition_object(page, page.containerID, true));
            } else if (page.nest == 1) {

                var parent_page = get_parent_page(page);
                var containerID = parent_page.urlSegment + "-" + parent_page.id;
                page.containerID = containerID;
                transition_spool.push(create_transition_object(page, containerID, true));
            }
            if (child_page != undefined) {

                if (child_page.nest == 1) {
                    evaluate_page(child_page);
                } else {
                    console.log("ERROR - no child page found");
                }
            }
        };

        var get_parent_page = function (page) {
            var parent_page;
            for (var a = 0; a < page_list.length; a++) {
                var id = page_list[a].id;
                if (id == page.parentID) {
                    parent_page = page_list[a];
                }
            }
            return parent_page;
        };

        var get_root_nest_page = function (page) {

            //console.log("nest "+ page.nest);

            if (page.nest == 1) {
                var parent_page = get_parent_page(page);
                parent_page.navigate_to_child = page;
                return get_root_nest_page(parent_page);
            } else {
                return page;
            }

        };

        var update_and_check_transition_spool = function () {

            if (transition_spool.length > 0) {
                var index = transition_spool.length - 1;
                load_url(transition_spool[index]);
                transition_spool.pop();
            }
        };

        var get_destination_page = function () {

            var destination_page;

            var url = internal_call ? url_destination : window.location.href;
            url_object = create_url_object(url);

            for (var a = 0; a < page_list.length; a++) {

                var page = page_list[a];
                if (url_object.path_url == page.url_object.path_url) {

                    destination_page = page;
                    //console.log("Page Found");
                    break;
                }
            }
            return destination_page;
        };

        var get_http_url = function (url_object) {

            var http = window.location.href;
            var baseURL = "";
            var root = plugin.settings.root;
            var components = get_url_components(http);

            for (var a = 0; a < components.length; a++) {

                baseURL += components[a] + "/";
                if (components[a] == root) {
                    break;
                }
            }
            return clean_url(baseURL) + url_object.hash_url;
        };

        var get_path_url = function (url_object, hashtag) {

            var pathURL = "";
            var root = plugin.settings.root;
            var components = url_object.components;
            var passed_root = false;
            for (var a = 0; a < components.length; a++) {

                if (passed_root) {
                    pathURL += components[a] + "/";
                }
                if (components[a] == root) {
                    passed_root = true;
                }
            }
            var tag = (hashtag) ? "#" : "/";
            return tag + clean_url(pathURL);

        };

        var get_base_url = function (url_object) {

            var baseURL = "";
            var root = plugin.settings.root;
            var components = url_object.components;

            for (var a = 0; a < components.length; a++) {

                baseURL += components[a] + "/";
                if (components[a] == root) {
                    break;
                }
            }
            return clean_url(baseURL);

        };

        var get_url_components = function (url) {
            url = url.replace("#", "");
            return url.split('/');
        };

        var get_level_above_root_count = function (url_object) {

            var root = plugin.settings.root;
            var url_components = url_object.tempURL.split('/');
            var count = -1;
            for (var a = url_components.length - 1; a >= 0; a--) {
                count++;
                if (url_components[a] == root) {
                    break;
                }
            }
            return count;
        };

        var get_page_object_by_name = function (name) {

            var page = null;

            for (var a = 0; a < page_list.length; a++) {
                if (name == page_list[a].name) {
                    page = page_list[a];
                }
            }
            return page;
        };

        /**
         * starts the ajax call to a specific url
         * @param url
         * @param animate boolean true if you want the animation to take place, false is instant
         */
        var load_url = function (transition_object) {


            var url = transition_object.page.link;
            var animate = transition_object.animate;
            var $container = $('#' + transition_object.containerID);

            //console.log("load url:- " + url);
            //console.log("internal call: " + internal_call);
            //console.log("container:- " + $container.attr('class'));
            //console.log("animate: " + animate);
            if (!internal_call) {
                animate = false
                //console.log("no animation");

            }
            internal_call = false; //reset switch
            load_page_static_callback();
            check_function_and_call(plugin.settings.load_page_callback);

            var $previous_page = $container.find('.' + plugin.settings.animation_layer);
            $previous_page.removeClass('style');

            $.ajax(url)
                .done(function (response) {
                    //console.log("done");
                    //console.log(response);
                    check_function_and_call(plugin.settings.page_loaded_callback);
                    page_loaded_static_callback($container, $previous_page, response, animate, url, transition_object.page);

                })
                .fail(function (xhr) {
                    alert('Error: ' + xhr.responseText);
                });
        };

        var transition = function ($previous_page, animate, $container) {

            //Start Animation
            check_function_and_call(plugin.settings.start_animation_callback);
            start_animation_static_callback();

            var $ng_leave = $container.find('.' + plugin.settings.animation_leave);
            var $ng_enter = $container.find('.' + plugin.settings.animation_enter);

            var $animation_layer = $container.find('.' + plugin.settings.animation_layer);
            $animation_layer.addClass('running');
            //console.log("animation layer " + $animation_layer[0]);
            //console.log("enter " + $ng_enter[0]);
            //console.log("leave " + $ng_leave[0]);


            if (animate) { //checking which direction up or down the current menu system the animation is going

                var previous_sort_value = parseInt($previous_page.attr('sort'));
                var current_sort_value = parseInt($ng_enter.attr('sort'));

                //console.log("leave sort value " + previous_sort_value);
                //console.log("enter sort value " + current_sort_value);

                var incremental_animation = $container.find('.trans-page-info').attr('inc');
                var decremental_animation = $container.find('.trans-page-info').attr('dec');
                //console.log("container " +  $container[0]);
                //console.log("trans " +  $container.find('.trans-page-info')[0]);
                //console.log("incremental_animation " + incremental_animation);
                //console.log("decremental_animation " + decremental_animation);

                //console.log("previous_sort_value: " + previous_sort_value);
                //console.log("current_sort_value: " + current_sort_value);

                var transition_animation = (previous_sort_value < current_sort_value) ? incremental_animation : decremental_animation;
                //console.log("transition_animation " + transition_animation);
                $animation_layer.addClass(transition_animation);

            } else {
                $animation_layer.addClass('no-animation');
            }

            $ng_leave.attr('style', $previous_page.attr('style'));
            $ng_enter.attr('style', $previous_page.attr('style'));
            $ng_leave.html($previous_page.html());

            //end animation listener
            $ng_leave.css_animation_event_listener($animation_layer);

        };

        var setup_child_list = function () {

            $child_list = plugin.settings.child_list.find('li');
            child_count = $child_list.length;
            var $root = plugin.settings.child_list;
            page_list = [];

            $root.find('li').each(function () {

                var $page = $(this);

                page_list.push(create_page_object(
                    $page.attr('pageID'),
                    ($page.index() + 1),
                    $page.attr('parentID'),
                    $page.attr('className'),
                    $page.attr('title'),
                    clean_url($page.attr('link')),
                    $page.attr('nest'),
                    $page.attr('segment')
                ))
            });
            add_nest_container_IDs();
        };

        var add_nest_container_IDs = function () {

            for (var a = 0; a < page_list.length; a++) {
                var page = page_list[a];
                if (page.parentID != 0) {
                    for (var b = 0; b < page_list.length; b++) {

                        var lookup_page = page_list[b];

                        if (page.parentID == lookup_page.id) {
                            page.container = lookup_page.urlSegment + "-" + lookup_page.id;
                        }
                    }
                }
            }
        };

        var container_size_adjustments = function () {
            //add_ajax_links();
            setTimeout(function () {
                var $container = $('.' + plugin.settings.ajax_container);

                $('.animation-layer').css({
                    width: 100 + '%',
                    height: 'auto',// $container.height(),
                    top: 0,
                    left: 0
                })
            }, 100);
        };


        /****************************************
         *            NAVIGATION
         ***************************************/


        var update_navigation = function (page) {
            setup_navigation(page);

            var $li = $('#menu-' + page.name + "-" + page.id);
            if ($li.length > 0) {

                $('#nav').find('li').removeClass('current');
                $('#nav').find('li').removeClass('section');

                if ($li.attr('parent') != undefined) {
                    $('#' + $li.attr('parent')).addClass('section');
                }
                $li.addClass('current');
            }

            update_ball_nav(page);

        };

        var setup_navigation = function (page) {
            add_arrow_navigation(page);
            add_ball_navigation(page);
            add_swipe_navigation(page);
        };


        var add_arrow_navigation = function (page) {
            /**
             *  This will need to be changed later to incorporate mulitple layered navigation
             */
            $nav_next_frame = $('#' + plugin.settings.nav_next_frame);
            $nav_prev_frame = $('#' + plugin.settings.nav_prev_frame);

            $nav_next_frame.add_click_navigation();
            $nav_prev_frame.add_click_navigation();

            reset_buttons();

            $nav_prev_frame.attr('href', get_nav_link(page, -1));
            $nav_next_frame.attr('href', get_nav_link(page, 1));

        };


        var get_nav_link = function (page, direction) {

            var index = get_page_index(page);
            var link = -1;
            if (direction == 1) {
                if (index < page_list.length - 1) {
                    link = page_list[index + direction].link;
                }
            } else {
                if (index > 0) {
                    link = page_list[index + direction].link;
                }
            }
            return link;
        };

        var add_swipe_navigation = function (page) {

            var parent_page = get_parent_page(page);
            var $wrapper = $("#" + parent_page.name + "-" + parent_page.id);

            if ($wrapper.length > 0) {

                var hammertime = new Hammer($wrapper[0]);

                hammertime.on("swipeleft", function(event) {
                    navigate_to_url($nav_next_frame);
                });

                hammertime.on("swiperight",  function(event) {
                    navigate_to_url($nav_prev_frame);
                });
            }
        };

        var add_ball_navigation = function (page) {

            var $ball_block = get_ball_nav(page);
            var $ul = $ball_block.find('ul');
            var page_array = get_section_array(page);

            $ul.append(
                $.map(page_array, function (item, index) {
                        return $('<li>').addClass('circle ajax-link ball-nav-icon').attr({
                            href: item.link,
                            id: 'ball-nav-icon-' + item.id
                        });
                    }
                )
            );
            center_ball_navigation(page);
        };


        var center_ball_navigation = function (page) {

            var $ul = get_ball_nav(page).find('ul');
            $ul.css('margin-left', '-' + ($ul.width() / 2) + 'px');
        };

        var get_ball_nav = function (page) {
            return $('#nav-ball-block-' + page.id)
        };

        var update_ball_nav = function (page) {

            var parent_page = get_parent_page(page);
            var $ul = get_ball_nav(parent_page);
            $ul.find('.ball-nav-icon').removeClass('current');
            $('#ball-nav-icon-' + page.id).addClass('current');

        };

        var get_section_array = function (page) {

            var arr = [];

            for (var a = 0; a < page_list.length; a++) {
                var parentID = page_list[a].parentID;
                if (page.id == parentID) {
                    arr.push(page_list[a]);
                }
            }
            return arr;
        };

        var get_page_index = function (page) {

            var index;
            for (var a = 0; a < page_list.length; a++) {
                var id = page_list[a].id;
                if (id == page.id) {
                    index = a;
                }
            }
            return index;
        };


        var reset_buttons = function () {

            $nav_prev_frame.css('display', 'block');
            $nav_next_frame.css('display', 'block');

        };

        /**
         * gets the the last folder/page name in the url
         * @param url
         * @returns {string}
         */
        var extract_path_name = function (url) {

            //Remove unwanted slash from end of path
            url = clean_url(url);

            return url.substr(url.lastIndexOf('/') + 1);
        };

        /**
         * Removes unwanted slash from end of url
         * @param url
         * @returns {*}
         */
        var clean_url = function (url) {
            //removes extra '/' at the end of the string
            if (url.substr(-1) == "/") {
                url = url.substr(0, url.length - 1);
            }
            return url;
        };

        var initialise_dependencies = function () {
            //console.log("add dependencies");
        };


        //--------------------------------------//
        //      STATIC CALLBACKS
        //--------------------------------------//
        /**
         * static callbacks should not be overridden by the user
         */

        var end_animation_static_callback = function () {
            console.log(name + ' - animation finished');
            clicked = false;
            update_and_check_transition_spool();

            container_size_adjustments();

            clearInterval(interval);


        };

        var start_animation_static_callback = function () {
            console.log(name + ' - start animation');

            var $layer = $('.birds-nest').find('.animation-layer');


            interval = setInterval(function () {
                /*
                 console.log($layer.eq(1).css('height'));
                 console.log($layer.eq(1).css('width'));
                 console.log($layer.eq(1).css('opacity'));
                 console.log($layer.eq(1).position().left);
                 console.log($layer.eq(1).offset().left);
                 */
            }, 100);

        };

        var load_page_static_callback = function () {
            console.log(name + ' - loading page');
            page_loading = true;
        };

        var page_loaded_static_callback = function ($container, $previous_page, response, animate, url, page) {

            console.log(name + ' - page loaded');
            //console.log(response);
            $container.html(response);
            update_navigation(page);
            add_ajax_links();
            check_function_and_call(plugin.settings.initialise_javascript_dependencies);
            transition($previous_page, animate, $container);
            window.history.pushState("string", "Title", page.url_object.http_url);
            page_loading = false;

        };

        var get_page_ID_from_url = function (url) {

            url = url.replace('#', '/');
            var path = extract_path_name(url);
            var page = get_page_object_by_name(path);

            return page.id;
        };

        var get_first_child = function (page) {

            var child_page;
            for (var a = 0; a < page_list.length; a++) {
                var parentID = page_list[a].parentID;
                if (parentID == page.id && page_list[a].sort == 1) {
                    //console.log(page_list[a].name);
                    child_page = page_list[a];
                }
            }
            return child_page;
        };

        var check_function_and_call = function (function_name) {
            if (function_name) {
                function_name();
            }
        };

        var add_ajax_links = function () {

            $('*').each(function () {

                var $link = $(this);

                if ($link.hasClass('ajax-link')) {
                    if (!$link.hasClass('ajax-active')) {
                        $link.addClass('ajax-active');
                        $link.add_click_function();
                    }
                }
            });
        };

        var set_internal_call = function (url) {
            url_destination = url;
            //console.log("url " + url);
            animate_transition = true;
            internal_call = true;
        };

        var link_is_current_page = function (origin, destination) {
            return (get_page_ID_from_url(origin) == get_page_ID_from_url(destination));
        };

//--------------------------------------//
//    CUSTOM BINDING EVENTS
//--------------------------------------//

        /**
         *    Add custom methods to selectors
         *    These are called by adding the function to the selectors
         *    eg: $('.element).bind_event(args);
         */

        $.fn.add_click_function = function (args) {
            return this.each(function () {

                $(this).on('click', function (e) {
                    e.preventDefault();
                    navigate_to_url($(this));
                });
            });
        };

        $.fn.add_click_navigation = function (args) {
            return this.each(function () {

                $(this).on('click', function (e) {
                    e.preventDefault();
                    navigate_to_url($(this));
                });
            });
        };

        $.fn.css_animation_event_listener = function ($animation_layer) {
            return this.each(function () {

                $(this).bind('oanimationend animationend webkitAnimationEnd', function () {

                    $animation_layer.removeClass('running');
                    $(this).remove();
                    //Start Animation
                    check_function_and_call(plugin.settings.end_animation_callback);
                    end_animation_static_callback();

                });
            });
        };


//--------------------------------------//
//              OBJECTS
//--------------------------------------//

        var create_page_object = function (id, sort, parentID, className, title, link, nest, urlSegment) {

            var page = {};
            page.id = id;
            page.sort = sort;
            page.parentID = parentID;
            page.className = className;
            page.name = extract_path_name(link);
            page.title = title;
            page.link = link;
            page.nest = nest;
            page.urlSegment = urlSegment;
            page.url_object = create_url_object(link);

            return page;
        };

        var create_url_object = function (url) {

            var url_object = {};

            url_object.tempURL = clean_url(url);
            url_object.name = extract_path_name(url_object.tempURL);
            url_object.components = get_url_components(url_object.tempURL);
            url_object.levelsAboveRoot = get_level_above_root_count(url_object);
            url_object.base_url = get_base_url(url_object);
            url_object.path_url = get_path_url(url_object, false);
            url_object.hash_url = get_path_url(url_object, true);
            url_object.http_url = get_http_url(url_object);
            //console.log("base_url " + url_object.base_url);
            //console.log("path_url " + url_object.path_url);
            //console.log("hash_url " + url_object.hash_url);
            //console.log("http_url " + url_object.http_url);

            return url_object;
        };

        var create_transition_object = function (page, containerID, animate) {

            var trans = {};

            trans.animate = animate;
            trans.page = page;
            trans.containerID = containerID;

            return trans;

        };

//-----------------------------------------
//				INITIALISATION
//-----------------------------------------

        plugin.init();
    }
    ;
    String.prototype.replaceAt = function (index, character) {
        return this.substr(0, index) + character + this.substr(index + character.length);
    };

//-----------------------------------------
//				INVOCATION
//-----------------------------------------

    /**
     *  element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
     *  element.data('pluginName').settings.propertyName
     *
     */

    $.fn.ajax_plugin = function (options) {
        return this.each(function () {
            if (undefined == $(this).data(name)) {
                var plugin = new $.ajax_plugin(this, options);
                $(this).data(name, plugin);
            }
        });
    }

})
(jQuery, document, window);