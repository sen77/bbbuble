Number.prototype.format = function(){
   return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};
function l(txt){ //лог
    d3.select('#test').html(txt);
}
//(function(){
/*global d3*/
//var n = 20;
var width = document.body.clientWidth * 0.8, //window.innerWidth, //1600,
    height = width/2,
    margin ={top:5, bottom:50, left:25, right:5},
    domain ={lo: -10, hi:45};
var nodes=[], simulation,
    tags, tags_name,
    circls;
var m = 7, // number of distinct clusters
    k_circle = 0.95; // наложение кружков друг на друга
var color = ['#e20f0f', '#fc6464', '#ffaaaa','#c6dcff', '#9fc2f9', '#799ed8' , '#2741d8']; // /+5/0 / -5 / -25  // добавить белые для новых элементов

var context = d3.select("body").append("div")
                            .attr("id", "context_container")
                            .on("mousemove", function (d,i){ mainclck(d,i,d3.event);})
                           .style("width", width + "px")
                           .style("height", height +"px")  
                            .append("svg")
                           .attr("width", width)
                           .attr("height", height)  
                           
                           .append("g")
                           .attr("transform", function(d) { return "translate(" + width/2 + "," +height/2 + ")"; });
                           
var axisX,axisX_data, xScale; /*= d3.select(context.node().parentNode).append("g")                    
        .attr("class", "axisX");
        */
var axisY, axisY_data, yScale; 
  
// Define the div for the tooltip
var hint = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("position", "absolute")
    .style("opacity", 0);
    
hint.append("p")
    .attr("id", "hint_head");
hint.append("span")
    .attr("id", "hint_desripn");
hint.append("span")
    .attr("id", "hint_sum");
hint.append("span")
    .attr("id", "hint_prc");
hint.append("span")
    .attr("id", "hint_href");
    


d3.tsv("b2017data.csv", function(d) {
  //console.log(d.Description);
  return {
    Description: d.description, 
    sum: +d.budget_total,
    prc: ((d.prc=="-"||d.prc=="∞")?d.prc:+((+d.prc).toFixed(1) )),
    p_name: d.parent_name,
    tag: d.tags,
    code: d.code
  };
}, function(error, rows) {
  //console.log(rows);

	
	//-------------------------------
	rows.sort(function(a,b) {return (+a.sum < +b.sum) ? 1 : ((+b.sum < +a.sum) ? -1 : 0);}); // сортируем что бы при наложении маленькие налазили на большие
	  nodes.push.apply(nodes, rows);
	  
    var n = nodes.length - 1;
    // генерация свойств шариков 
    nodes.forEach(function(d) {
     d.index =arguments[1];
      var i = d.prc < -25?6:  // - 25
              d.prc < -5?5:  // -25 - -5
              d.prc < -0.1?4: // -5 - 0
              d.prc <  0.1?3: // 0
              d.prc <  5?2:  // 0-5
              d.prc <  25?1:0, // 25
           //№ категории int
          // v = (i + 1) / m * -Math.log(Math.random()); // получение размера шарика (чем меньше №категории, тем мешье размер)
    	  v = -Math.log(Math.random())*m;
    	 // console.log(d.sum);
      d.r = Math.floor(Math.pow(d.sum, 1/2.5)/(28/2)) * k_circle;
                  
          //Math.floor(d.sum/1000000*10),//Math.sqrt(v) * maxRadius,
       d.color = color[i]; //arguments[1] < 100 ? "brown" : "steelblue"; //d.color = color[i],
    	//Точка спавна. если все будет спавнится в одной точке, то будет выдавать ошибку
    	//d.y =  (i)*120 - Math.floor(Math.random()*10);
    	
        //  координаты центра группы (для каждого объекта)
        //d.cx = width/2; //x(i),
        //d.cy = height / 2
    });
  
  nodes = d3.packSiblings(nodes);  
  iniCircls (nodes);
  sim(nodes);
  
  // ini axisX
    tags =(d3.nest()
            .key(function(d) { return d.tag; })
            .rollup(function(leaves) { return {"total": d3.sum(leaves, function(d) {return parseFloat(d.sum);})} })
            .entries(nodes)
        ).sort(function(a,b) { return b.value["total"] - a.value["total"]});
    tags_name = Object.keys(tags).map(function(val) {return tags[val].key;}); //переводим имена в массив
  
    xScale = d3.scalePoint()
        .domain(tags_name)
        .padding(.7)
        .range([0, width -(margin.left + margin.right)]);
        
    axisX = d3.select(context.node().parentNode).append("g")  
        .attr("transform", "translate(" + margin.left +"," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(xScale))
        .selectAll(".tick text")
            .call(wrap, (width -(margin.left + margin.right))/tags_name.length)
        //.selectAll("text")
            .attr("transform", "rotate(-0)");
    
    
    yScale = d3.scaleLinear()
            .range([0, height -(margin.bottom + margin.top)])
            .domain([domain.hi, domain.lo])
            .clamp(true);
            
    axisY = d3.select(context.node().parentNode).append("g") 
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
            .call(d3.axisLeft(yScale));
    
}
);

function iniCircls (nodes){
  circls= context
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr("fill", function (d) {return d.color;})
    .attr("r", function (d) {return d.r / k_circle;})
    .attr("cx", function (d) {return d.x;})
    .attr("cy", function (d) {return d.y;})
    .on("mouseover", function (d,i){ showHint(d,i,[d3.event.pageX, d3.event.pageY]);})
    //.call(drag)  //(https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b)
}

function circlsByDpts(){

    simulation
        .force("gotoDptsX", d3.forceX(function(d){ return xScale(d.tag) - width/2 + margin.left}).strength(0.051)) // d3.forceCenter([xScale(d.tag)
        .force("gotoDptsY", d3.forceY(function(d){ 
                var t_prc = d.prc=="-"?(domain.lo-1):(d.prc=="∞"||isNaN(d.prc))?(domain.hi+1):d.prc;
                console.log(d.Description, t_prc, yScale(t_prc), height, margin.left);
                return yScale(t_prc) - height/2 + margin.top;
            }).strength(0.1)) // d3.forceCenter([xScale(d.tag)
        .force("charge", d3.forceManyBody().strength(.051))
        .force("collide", d3.forceCollide().radius(function(d) { return d.r*.4; }).iterations(2))
        .alpha(1)
        .restart()

}

function sim(nodes){
  
    simulation = d3.forceSimulation(nodes)
        //.force("y", d3.forceY()) // разбрасывает все по оси Х
        //.force("brown", isolate(d3.forceX(-width / 10), function(d) { return d.color === '#9fc2f9'; })) //"brown"
        //.force("steelblue", isolate(d3.forceX(width / 10), function(d) { return d.color === '#e20f0f'; }))
        .force("charge", d3.forceManyBody().strength(-0.051)) //-10 расстояние между кружочками
        .force("collide", d3.forceCollide().radius(function(d) { return d.r + 0; }).iterations(2))
        .on("tick", ticked);
}
    
function ticked() {
  circls
    .attr('cx', function (d) { return d.x; })  
    .attr('cy', function (d) { return d.y; }); 
  /*
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2); // ставим координату [0,0] на середину
  nodes.forEach(drawNode);
  context.restore();
  */
}

function drawNode(d) {
  context.beginPath();
  context.moveTo(d.x + 3, d.y);
  context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
  context.fillStyle = d.color;
  context.fill();
}

function isolate(force, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}

function showHint(d, i, e){
    hint.transition()
        .duration(0)
        .style("opacity", 0)
        .style("visibility", "visible");
    hint.transition()
        .duration(600)
        .style("opacity", .9);
        
    hint.select('#hint_head').html(d.p_name);
    hint.select('#hint_desripn').html(d.code + " - " + d.Description);
    hint.select('#hint_sum').html((+(d.sum/1000).toFixed(1)).format() + " млн. грн.");
    hint.select('#hint_prc').html(d.prc + "%");
    /*hint.html(d.Description + "<br/>" 
                + (+(d.sum/1000).toFixed(1)).format() + " млн. грн." + "<br/>" 
                + (d.prc*100).toFixed(1) + "%")
    */            
    hint.style("left", (e[0] + 10) +"px")
        .style("top", (e[1] + 10) +"px");
        
    l(e[0] +' - ' + e[1] + " - " + window.innerWidth);
 
}
function hideHint(){
   
   
    hint.transition()
        .duration(200)
        .style("visibility", "hidden");        
    

        
    //hint.html("");
}

function mainclck(d,i,e){
    if (!e.target.__data__){
       hideHint();
       
   }
   //l((e.target.__data__?e.target.__data__.index:"") + " - " + e.target.offsetLeft + " - " + e.target.offsetTop);
}

    
//})();

function showAxisX(){
    
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });

}

