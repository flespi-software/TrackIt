var fs = require('fs')
var UglifyJS = require('uglify-es')

module.exports = {
  loadMinified: function (filePath) {
    var code = fs.readFileSync(filePath, 'utf-8')
    var result = UglifyJS.minify(code)
    if (result.error) {
      return ''
    }
    return result.code
  }
}
