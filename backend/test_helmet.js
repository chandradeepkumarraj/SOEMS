const helmet = require('helmet');
try {
    console.log('Helmet CSP:', typeof helmet.contentSecurityPolicy);
    console.log('Default Directives:', typeof helmet.contentSecurityPolicy.getDefaultDirectives);
    console.log('Success: helmet import and static methods are available.');
} catch (e) {
    console.error('Error in helmet access:', e.message);
}
