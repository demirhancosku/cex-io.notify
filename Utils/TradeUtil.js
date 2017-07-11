/**
 * Created by coskudemirhan on 07/07/2017.
 */
var timeseries = require("timeseries-analysis");



module.exports = {
    peakPromise : function (smoothedTimeSerie,degree) {
        var datas = smoothedTimeSerie.data.slice(- degree);
        var selectedArea = new timeseries.main(datas);
        var raw_values = selectedArea.data;


        //var min = selectedArea.min();
        var max = selectedArea.max();

        //var deviation = selectedArea.stdev();

        if(raw_values[Math.ceil(degree/2)+1][1] === max){
            return true;
        }else{
            return false;
        }

    },
    deepPromise : function (smoothedTimeSerie,degree) {

        var datas = smoothedTimeSerie.data.slice(- degree);
        var selectedArea = new timeseries.main(datas);
        var raw_values = selectedArea.data;


        var min = selectedArea.min();
        //var max = selectedArea.max();

        //var deviation = selectedArea.stdev();

        if(raw_values[Math.ceil(degree/2)+1][1] === min){
            return true;
        }else{
            return false;
        }

    }
}