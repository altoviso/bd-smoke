/* eslint-disable no-console */
const cp = require('child_process');

function rollup() {
    cp.execSync('node node_modules/rollup/bin/rollup -c', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}

module.exports = grunt => {
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('rollup', rollup);

    grunt.initConfig({
        exec: {
            rollup: './node_modules/.bin/rollup -c'
        },
        watch: {
            rollup: {
                files: ['./src/**/*.*'],
                tasks: ['rollup']
            }
        }
    });
};
