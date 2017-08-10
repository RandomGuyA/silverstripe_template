<?php

global $project;
$project = 'mysite';


/**************************
 *       DATABASE
 *************************/

global $databaseConfig;
$databaseConfig = array(
	'type' => 'MySQLDatabase',
	'server' => 'localhost',
	'username' => 'root',
	'password' => '',
	'database' => '',
	'path' => ''
);

Security::setDefaultAdmin('','');

/**************************
 *       LOCALE
 *************************/

i18n::set_locale('en_GB');
Translatable::set_default_locale('en_GB');
Translatable::set_allowed_locales(array(
        'cy_GB',  //Welsh
        'en_GB',
    )
);

/**************************
 *     ERROR HANDLING
 *************************/

FulltextSearchable::enable(array('SiteTree'));

if (Director::isDev()) {
    // Turn on all errors
    ini_set('display_errors', 1);
    ini_set("log_errors", 1);
    // error_reporting(E_ERROR | E_PARSE);
    // error_reporting(E_ALL && ~E_DEPRECATED);
    error_reporting(E_ALL | E_STRICT);

    SS_Log::add_writer(new SS_LogFileWriter(dirname(__FILE__).'/errors.log'));

    // Use Mailgun to send all emails while in DEV mode
    // When in LIVE/TEST mode all emails will be sent via the default Mail class.
    Email::set_mailer( new SmtpMailer() );

    // SSViewer::flush_template_cache();
    // Email::send_all_emails_to('?@platocreative.co.nz');
}

if (Director::isTest()) {

    // BasicAuth::protect_entire_site();

    ini_set('display_errors', 1);
    ini_set("log_errors", 1);
    error_reporting(E_ALL | E_STRICT);

    SS_Log::add_writer(new SS_LogFileWriter(dirname(__FILE__).'/errors.log'));

    // Email::set_mailer( new SmtpMailer() );
    //Email::send_all_emails_to('?@platocreative.co.nz');

}

/**************************
 *      EXTENSIONS
 *************************/

Object::add_extension('SiteTree', 'Translatable');
Object::add_extension('SiteConfig', 'Translatable'); // 2.4 or newer only
