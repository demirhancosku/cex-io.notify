/**
 * Created by coskudemirhan on 07/07/2017.
 */
var timeseries = require("timeseries-analysis");



module.exports = {
    peakPromise : function (smoothedTimeSerie,degree) {
        var datas = smoothedTimeSerie.smoother({period:degree}).data.slice(- degree);
        var selectedArea = new timeseries.main(datas);
        var raw_values = selectedArea.data;


        //var min = selectedArea.min();
        var max = selectedArea.max();
        var key;

        //console.log(raw_values);
        for(m in raw_values){
            if(raw_values[m][1] === max){
                key = parseInt(m);
            }
        }

        //console.log((parseInt(Math.ceil(degree/2))-1) - parseInt(degree/6) , (parseInt(Math.ceil(degree/2))-1) + parseInt(degree/6),key);

        if((parseInt(Math.ceil(degree/2))-1) - parseInt(degree/6) < key && (parseInt(Math.ceil(degree/2))-1) + parseInt(degree/6) > key ){
            return true;
        }else{
            return false;
        }

    },
    deepPromise : function (smoothedTimeSerie,degree) {

        var datas = smoothedTimeSerie.smoother({period:degree}).data.slice(- degree);
        var selectedArea = new timeseries.main(datas);
        var raw_values = selectedArea.data;

        var min = selectedArea.min();
        var key;

        for(m in raw_values){
            if(raw_values[m][1] === min){
                key = m;
            }
        }

        if((parseInt(Math.ceil(degree/2))-1) - parseInt(degree/6) < key && (parseInt(Math.ceil(degree/2))-1) + parseInt(degree/6) > key ){
            return true;
        }else{
            return false;
        }

    }
}