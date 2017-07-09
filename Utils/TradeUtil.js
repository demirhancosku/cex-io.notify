/**
 * Created by coskudemirhan on 07/07/2017.
 */

module.exports = {
    peakPromise : function (smoothedTimeSerie,degree) {
        var maxsmoothed = smoothedTimeSerie.smoother(degree);
        var raw_values = maxsmoothed.data.slice(smoothedTimeSerie.data.length - degree);
        var min = maxsmoothed.min();
        var max = maxsmoothed.max();

        var deviation = maxsmoothed.stdev();

        console.log(min,max);
        console.log(raw_values);
        console.log(deviation);


        /*
        var results = []
        for(i in raw_values) {
            res += raw_values[i][1] * Math.pow(-1, parseInt(i))
        }
        return results
        */
    },
    deepPromise : function (smoothedTimeSerie,degree) {
        var maxsmoothed = smoothedTimeSerie.smoother(degree);
        var raw_values = maxsmoothed.data.slice(smoothedTimeSerie.data.length - degree);
        var min = maxsmoothed.min();
        var max = maxsmoothed.max();

        var deviation = maxsmoothed.stdev();

        console.log(min,max);
        console.log(raw_values);
        console.log(deviation);



    }
}