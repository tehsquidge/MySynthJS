module.exports = function(grunt) {

  // configure the tasks
  grunt.initConfig({
    concat: {
      build: {
        src: [
                'js/src/classes/*.js',
                'js/src/header.js',
                'js/src/main.js'
             ],
        dest: 'js/main.js',
        nonull: true
     }
    }
    
  });

  // load the tasks
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');




  // define the tasks
  grunt.registerTask(
      'build',
      'BUILD BUILD BUILD!!!!',
      [ 'concat' ]
  );

};
