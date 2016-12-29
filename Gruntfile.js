module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
      copy: {
        main: {
          files: [
            {expand: true, flatten: true, src: ['node_modules/bootstrap/dist/css/bootstrap.*'], dest: 'public/stylesheets/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/bootstrap/dist/fonts/*'], dest: 'public/fonts/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/bootstrap/dist/js/bootstrap.js'], dest: 'public/javascripts/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/jquery.cookie/jquery.cookie.js'], dest: 'public/javascripts/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/jquery/dist/jquery.min.js'], dest: 'public/javascripts/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/jquery-lazyload/jquery.lazyload.js'], dest: 'public/javascripts/', filter: 'isFile'},
            {expand: true, flatten: true, src: ['node_modules/jquery-lazyload/jquery.scrollstop.js'], dest: 'public/javascripts/', filter: 'isFile'},
          ]
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default',['copy:main']);
};