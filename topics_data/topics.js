let liwc_meaning = {
    social: "Speech contains social concerns",
    anger: "Speech contains anger",
    sad: "Speech contains sadness",
    time: "Speech refering to time itself"
}

let real_world = {
    'Seth Rich': [

    ]
}

function domain_from_url(url) {
    var result
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result
}

data = raw_data.reduce((topics, topic) => {
    let currentPeriod = topics.find((t) => {
        if (t.period == topic.created_at_month) return true;
        return false;
    })
    if (!currentPeriod){
        topics.push({
            period: topic.created_at_month,
            topics: [topic]
        })
        return topics;
    }
    currentPeriod.topics.push(topic);
    return topics;
}, []);

Highcharts.setOptions({
    chart: {
        style: {
            fontFamily: 'Roboto'
        }
    }
});


let categories = [];
let topicsSeriesMap = {};
let allTopics = [];

data.forEach((period) => {
    if (period.period === '2018-05'){
        return;
    }
    categories.push(period.period);
    period.topics.slice(0, 3).forEach((topic) => { // Only top 5 for each period
        if (!(topic.topic_title in topicsSeriesMap)){
            topicsSeriesMap[topic.topic_title] = {
                name: topic.topic_title,
                data: [],
                metadata: {}
            }
            allTopics.push(topic.topic_title);
        }
    })    
})

data.forEach((period) => {
    if (period.period === '2018-05'){
        return;
    }
    let topics = period.topics.slice(0, 3); // Only top 5 for each period
    let topicsOnPeriod = [];
    topics.forEach((topic) => {
        topicsSeriesMap[topic.topic_title].data.push(topic.score_total);
        topicsSeriesMap[topic.topic_title].metadata[period.period] = {...topic};
        topicsOnPeriod.push(topic.topic_title);
    })
    allTopics.forEach(topic => {
        if (!topicsOnPeriod.includes(topic)){
            topicsSeriesMap[topic].data.push(0.0);
        }
    })
});

Highcharts.chart('container', {
    chart: {
      type: 'column'
    },
    title: {
      text: 'What is GAB talking about? (Based on Gab topics)'
    },
    subtitle: {
      text: 'Analyzing Gab topics & sentiments through time [Click on a column to see detailed information]'
    },
    legend: {
        maxHeight: 150
    },
    xAxis: {
      categories: categories,
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Topics Score (number of likes - dislikes)'
      }
    },
    tooltip: {
        formatter: function() {
            return  `
                <table style="font-size:12px">
                <span style="font-size:11px">${this.x} topics score</span>
                    ${this.points.filter(point => point.y > 0).map((point) => { return `
                        <tr>
                            <td style="color:${point.color};padding:0">${point.series.name}: </td>
                            <td style="padding:0"><b>${point.y}</b>
                            </td>
                        </tr>                
                    `}).join(' ')
                    }
                </table>
            `
        },
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      },
      series: {
        stacking: 'normal',
        cursor: 'pointer',
        point: {
            events: {
                click: function () {
                    let topicMetadata = topicsSeriesMap[this.series.name].metadata[this.category];
                    let liwc_sentiment = Object.entries(topicMetadata.liwc_sentiment_map);
                    liwc_sentiment.sort(function(a, b) {
                        return b[1] - a[1];
                    })
                    liwc_sentiment = liwc_sentiment.filter((s) => !['focuspresent', 'focuspast', 'focusfuture'].includes(s[0]));
                    let vaderSentiment = topicMetadata.avg_vader_sentiment;
                    console.log(vaderSentiment);
                    let sentimentIcon = vaderSentiment < 0.20 & vaderSentiment < -0.20 ? 'sentiment_very_dissatisfied' : (vaderSentiment > 0.20) ? 'sentiment_satisfied_alt' : 'sentiment_neutral';
                    let sentimentText = vaderSentiment < 0.20 & vaderSentiment < -0.20 ? 'Overall negative' : (vaderSentiment > 0.20) ? 'Overall positive' : 'Overall neutral';
                    $('.topic-container').append(
                        `
                            <div class="topic-detail animate__animated animate__fadeIn animate__faster">
                                <div class="close-topic">
                                    <span class="material-icons">
                                        highlight_off
                                    </span>
                                </div>
                                <div class="topic-name">
                                    <span style="font-size:11px; font-weight:normal;"> ${this.category} </span>
                                    <div> ${this.series.name} </div>
                                </div>
                                    <div class="topic-content">
                                        <div class="topic-sentiments">

                                            <div class="likes animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.2s;">    
                                                <span class="material-icons">
                                                    chat
                                                </span>
                                                <span class="n-likes">
                                                    ${topicMetadata.number_of_messages}
                                                </span>
                                            </div>

                                            <div class="likes animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.1s;">  
                                                <span class="material-icons">
                                                    thumb_up_off_alt
                                                </span>
                                                <span class="n-likes">
                                                    ${topicMetadata.likes_total}
                                                </span>
                                            </div>
                                            <div class="likes animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.2s;">    
                                                <span class="material-icons">
                                                    thumb_down_off_alt
                                                </span>
                                                <span class="n-likes">
                                                    ${topicMetadata.dislike_total}
                                                </span>
                                            </div>

                                            <span style="display: flex;justify-content: center;font-size:11px; margin-top: 8px; font-weight:normal; color: white; animation-delay: 0.2s;" class="animate__animated animate__fadeIn animate__faster"> 
                                                ${sentimentText} sentiments
                                            </span>
                                            <div class="likes flex-col animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.3s;">   
                                                <div class="emotions-icons"> 
                                                    <span class="material-icons">
                                                        ${sentimentIcon}
                                                    </span>
                                                    <span class="material-icons">
                                                        ${sentimentIcon}
                                                    </span>   
                                                    <span class="material-icons">
                                                        ${sentimentIcon}
                                                    </span>                                                
                                                </div>

                                                <span style="font-size:11px; margin-bottom: 8px; margin-top: 8px; font-weight:normal; color: white; animation-delay: 0.2s;" class="animate__animated animate__fadeIn animate__faster"> 
                                                    How is Gab speech toward this topic?
                                                </span>
                                                <div class="emotions liwc animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.4s;"> 
                                                    <span class="n-likes" style="font-size: 22px;">
                                                        ${liwc_sentiment[0][0].replace('_', ' ')}: ${Math.round(liwc_sentiment[0][1], 1)}%
                                                        ${ liwc_meaning[liwc_sentiment[0][0]] ? `<br><span style="font-size:11px"> ${liwc_meaning[liwc_sentiment[0][0]]} </span>` : `` }
                                                    </span>
                                                    <span class="n-likes" style="font-size: 20px;">
                                                        ${liwc_sentiment[1][0].replace('_', ' ')}: ${Math.round(liwc_sentiment[1][1], 1)}%
                                                        ${ liwc_meaning[liwc_sentiment[1][0]] ? `<br><span style="font-size:11px"> ${liwc_meaning[liwc_sentiment[1][0]]} </span>` : `` }

                                                    </span>
                                                    <span class="n-likes" style="font-size: 18px;">
                                                        ${liwc_sentiment[2][0].replace('_', ' ')}: ${Math.round(liwc_sentiment[2][1], 1)}%
                                                        ${ liwc_meaning[liwc_sentiment[2][0]] ? `<br><span style="font-size:11px"> ${liwc_meaning[liwc_sentiment[2][0]]} </span>` : `` }
                                                    </span>
                                                    <span class="n-likes" style="font-size: 16px;">
                                                        ${liwc_sentiment[3][0].replace('_', ' ')}: ${Math.round(liwc_sentiment[3][1], 1)}%
                                                        ${ liwc_meaning[liwc_sentiment[3][0]] ? `<br><span style="font-size:11px"> ${liwc_meaning[liwc_sentiment[3][0]]} </span>` : `` }
                                                    </span>
                                                </div>
                                            </div>
                                        
                                        </div>
                                        
                                        <div id="topic-wordcloud" class="wordcloud animate__animated animate__fadeIn" style="animation-delay: 0.5s;">

                                        </div>
                                        
                                        <div class="users">
                                            <div class="emotions"> 
                                                <span style="font-size:11px; font-weight:normal; animation-delay: 0.6s;" class="animate__animated animate__fadeIn animate__faster"> 
                                                    Users relevant to the topic (based on the amount of likes in their messages)
                                                </span>
                                                <span class="n-likes animate__animated animate__fadeIn animate__faster" style="font-size: 32px; animation-delay: 0.6s;">
                                                    1. <a href="https://gab.com/${topicMetadata.users[0]}" target="_blank"> ${topicMetadata.users[0]} </a>
                                                </span>
                                                <span class="n-likes animate__animated animate__fadeIn animate__faster" style="font-size: 24px; animation-delay: 0.7s;">
                                                   2. <a href="https://gab.com/${topicMetadata.users[1]}" target="_blank"> ${topicMetadata.users[1]} </a>
                                                </span>
                                                <span class="n-likes animate__animated animate__fadeIn animate__faster" style="font-size: 18px; animation-delay: 0.8s;">
                                                   3. <a href="https://gab.com/${topicMetadata.users[2]}" target="_blank"> ${topicMetadata.users[2]} </a>
                                                </span>
                                                <span class="n-likes animate__animated animate__fadeIn animate__faster" style="font-size: 16px; animation-delay: 0.9s;">
                                                   4. <a href="https://gab.com/${topicMetadata.users[3]}" target="_blank"> ${topicMetadata.users[3]} </a>
                                                </span>
                                                <span class="n-likes animate__animated animate__fadeIn animate__faster" style="font-size: 14px; animation-delay: 1.0s;">
                                                    5. <a href="https://gab.com/${topicMetadata.users[4]}" target="_blank"> ${topicMetadata.users[4]} </a>
                                                </span>
                                            </div>
                                            ${
                                                (topicMetadata.news ? `                                                
                                                    <div style="animation-delay: 1.1s;" class="news-articles animate__animated animate__fadeIn animate__faster">
                                                        <span style="display: flex;justify-content: center;font-size:11px; font-weight:normal; color: white; animation-delay: 0.2s;" class="animate__animated animate__fadeIn animate__faster"> 
                                                            News articles about this topic
                                                        </span>
                                                        <div class="news">
                                                            ${
                                                                topicMetadata.news.map(article => {
                                                                    return `
                                                                        <div class="article">
                                                                            <a href="${article}" target="_blank">
                                                                                <span class="material-icons">
                                                                                    public
                                                                                </span>
                                                                                <span class="article-domain"> ${domain_from_url(article)} </span>
                                                                            </a>
                                                                        </div>
                                                                    `;
                                                                }).join(' ')
                                                            }
                                                        </div>
                                                    </div>                                                
                                                ` : ``)
                                            }

                                            ${
                                                graph_data[this.category + "_" + this.series.name] ? 
                                                `
                                                <div class="graph-box animate__animated animate__fadeIn animate__faster"> 
                                                    <button class="action-button">
                                                        ${"SEE USERS INTERACTION"}
                                                    </button>
                                                </div>
                                                ` : `` 
                                            }

                                            <div class="sample-box animate__animated animate__fadeIn animate__faster"> 
                                                <button class="action-button">
                                                    ${"SEE MESSAGES"}
                                                </button>
                                            </div>

                                            ${
                                                twitter_data[this.series.name] ? 
                                                `
                                                <div class="comparison-box animate__animated animate__fadeIn animate__faster"> 
                                                    <button class="action-button">
                                                        ${"Gab vs Twitter"} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-twitter" viewBox="0 0 16 16">
                                                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                                                      </svg>
                                                    </button>
                                                </div>
                                                ` : `` 
                                            }

                                        </div>
                                    </div>
                                </div>
                            </div>
                        `
                    )
                    $('.close-topic').click(() => {
                        $('.topic-detail').removeClass('animate__fadeIn');
                        $('.topic-detail').addClass('animate__fadeOut');
                        setTimeout(() => {
                            $('.topic-detail').remove();
                        }, 500);
                    });

                    $('.comparison-box').click(() => {

                        let twitterMetadata = twitter_data[this.series.name];

                        let t_liwc_sentiment = Object.entries(twitterMetadata.liwc_sentiment_map);
                        t_liwc_sentiment.sort(function(a, b) {
                            return b[1] - a[1];
                        })
                        t_liwc_sentiment = t_liwc_sentiment.filter((s) => !['focuspresent', 'focuspast', 'focusfuture'].includes(s[0]));
                        let t_vaderSentiment = twitterMetadata.avg_vader_sentiment;
                        let t_sentimentIcon = t_vaderSentiment < 0.20 ? 'sentiment_very_dissatisfied' : (t_vaderSentiment > 0.20) ? 'sentiment_satisfied_alt' : 'sentiment_neutral';
                        let t_sentimentText = t_vaderSentiment < 0.20 ? 'Overall negative' : (t_vaderSentiment > 0.20) ? 'Overall positive' : 'Overall neutral';

                        liwc_dimensions = ['negative_emotions', 'positive_emotions', 'anger', 'sad', 'anxiety', 'social', 'death', 'religion']

                        $('.topic-container').append(
                            `
                            <div class="sample-detail animate__animated animate__fadeIn animate__faster">
                                <div class="close-sample">
                                    <span class="material-icons">
                                        highlight_off
                                    </span>
                                </div>
                                <div class="topic-name">
                                    <span style="font-size:11px; font-weight:normal;"> ${this.category} | Gab vs Twitter </span>
                                    <div> ${this.series.name}</div>
                                </div>
                                    <div class="topic-content">
                                        <div class="three-columns">
                                            <div class="topic-sentiments">
                                                <span class="n-likes" style="font-size:24px; margin-top:16px;">
                                                    Dimension
                                                </span>
                                                <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                    Overall Sentiment
                                                </span>
                                                ${
                                                    liwc_dimensions.map((d) => {
                                                        return `
                                                            <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                                ${d}
                                                            </span>
                                                        `;
                                                    }).join(' ')
                                                }
                                            </div>
                                            <div class="topic-sentiments">
                                                <span class="n-likes" style="font-size:24px; margin-top:16px;">
                                                    Gab
                                                </span>
                                                <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                    ${Math.round(vaderSentiment * 100) / 100}
                                                </span>
                                                ${
                                                    liwc_dimensions.map((d) => {
                                                        return `
                                                            <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                                ${Math.round(topicMetadata.liwc_sentiment_map[d] * 100) / 100}%
                                                            </span>
                                                        `;
                                                    }).join(' ')
                                                }
                                            </div>
                                            <div class="topic-sentiments">
                                                <span class="n-likes" style="font-size:24px; margin-top:16px;">
                                                    Twitter
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-twitter" viewBox="0 0 16 16">
                                                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                                                    </svg>
                                                </span>
                                                <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                    ${Math.round(t_vaderSentiment * 100) / 100}
                                                </span>
                                                ${
                                                    liwc_dimensions.map((d) => {
                                                        return `
                                                            <span class="n-likes" style="font-size:16px; margin-top:16px;">
                                                                ${Math.round(twitterMetadata.liwc_sentiment_map[d] * 100) / 100}%
                                                            </span>
                                                        `;
                                                    }).join(' ')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `
                        );
                        $('.close-sample').click(() => {
                            $('.sample-detail').removeClass('animate__fadeIn');
                            $('.sample-detail').addClass('animate__fadeOut');
                            setTimeout(() => {
                                $('.sample-detail').remove();
                            }, 500);
                        });
                    });

                    $('.graph-box').click(() => {
                        $('.topic-container').append(
                            `
                            <div class="sample-detail animate__animated animate__fadeIn animate__faster" style="height: 140% !important;">
                                <div class="close-sample">
                                    <span class="material-icons">
                                        highlight_off
                                    </span>
                                </div>
                                <div class="topic-name">
                                    <span style="font-size:11px; font-weight:normal;"> ${this.category} | Users interaction </span>
                                    <div> ${this.series.name}</div>
                                </div>
                                <div id="chartFigure" class="chart-figure">    
                                </div>
                            </div>
                            `
                        );
                        $('.close-sample').click(() => {
                            $('.sample-detail').removeClass('animate__fadeIn');
                            $('.sample-detail').addClass('animate__fadeOut');
                            setTimeout(() => {
                                $('.sample-detail').remove();
                            }, 500);
                        });


                        let width = 936;
                        let height = 700;
                        let radius = 15;
                        var svg = d3.select("#chartFigure")
                         .append("svg").attr("width", width).attr("height", height);
                        
                        var color = d3.scaleOrdinal(d3.schemeCategory20);
                        
                        var simulation = d3.forceSimulation()
                        .force("link", d3.forceLink().id(function(d) { return d.id; }))
                        .force("charge", d3.forceManyBody())
                        .force("center", d3.forceCenter(width / 2, height / 2))
                        // .velocityDecay(0.1)
                        // .force("x", d3.forceX(width / 2).strength(.05))
                        // .force("y", d3.forceY(height / 2).strength(.05))
                        // .force("charge", d3.forceManyBody().strength(-240))
                        // .force("link", d3.forceLink().distance(50).strength(1).id(function(d) { return d.id; }));
                        
                        let graph_index = this.category + "_" + this.series.name;
                        console.log(graph_index);
                        let graph = graph_data[graph_index];
                        if (!graph){
                            return;
                        }

                        let users_by_group = graph.nodes.reduce((usersGroups, node) => {
                            if (!(node.group in usersGroups)){
                                usersGroups[node.group] = 0
                            }
                            usersGroups[node.group] += 1
                            return usersGroups;
                        }, {});

                        // Create items array
                        var items = Object.keys(users_by_group).map(function(key) {
                            return [key, users_by_group[key]];
                        });
                        
                        // Sort the array based on the second element
                        items.sort(function(first, second) {
                            return second[1] - first[1];
                        });
                        
                        top_10_groups = items.slice(0, 15).map(i => i[0]);

                        graph.nodes = graph.nodes.map((n) => {
                            if (top_10_groups.includes(n.group.toString())){
                                return n;
                            } 
                            return {
                                ...n,
                                group: 69
                            }
                        });
                        
                        var link = svg.append("g")
                          .attr("class", "links")
                          .selectAll("line")
                          .data(graph.edges)
                          .enter().append("line")
                          .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
                        
                        // Three function that change the tooltip when user hover / move / leave a cell
                        var mouseover = function(d) {
                        //   Tooltip
                        //     .style("opacity", 1)
                        //     .style("box-shadow", "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)")
                        //     .attr("class", "graph-tooltip animate__animated animate__fadeIn animate__faster")
                          d3.select(this)
                            .style("opacity", 1);
    
                        }
                        var mousemove = function(d) {
                          d3.select(".graph-tooltip").style('background-color', color(d.group));
                        //   Tooltip
                        //     .html("User: " + d.id + ", " + graph_groups_data[d.group].info)
                        }
                        var mouseleave = function(d) {
                        //   Tooltip
                        //     .style("opacity", 0)
                        //     .attr("class", "graph-tooltip animate__animated animate__fadeOut animate__faster")
                          d3.select(this)
                            .style("stroke", "none")
                            .style("opacity", 0.8)
                        }
                        
                        var node = svg.append("g")
                          .attr("class", "nodes")
                          .selectAll("g")
                          .data(graph.nodes)
                          .enter().append("g")
                          .on("mouseover", mouseover)
                          .on("mousemove", mousemove)
                          .on("mouseleave", mouseleave)
                        
                        
                        let minDegree = Infinity;
                        let maxDegree = 0;
                        graph.nodes.forEach(node => {
                          if (node.pagerank < minDegree){
                              minDegree = node.pagerank;
                          }
                          if (node.pagerank > maxDegree){
                              maxDegree = node.pagerank;
                          }
                        })
                        
                        
                        // var Tooltip = d3.select("#chartFigure")
                        //   .append("div")
                        //   .style("opacity", 0)
                        //   .attr("class", "graph-tooltip")
                        //   .style("background-color", "white")
                        //   .style("color", "white")
                        //   .style("position", "absolute")
                        //   .style("padding", "8px")
                        //   .style("top", '0px')
                        //   .style("left", '0px')
                        
                        
                        var minRadius = 5;
                        var maxRadius = 17;
                        var scale = d3.scaleSqrt().domain( [minDegree, maxDegree] ).range([minRadius,maxRadius]);
                        
                        node.append("circle")
                          .attr("r", function(d) { 
                              return scale(d.pagerank);
                          })
                          .attr("fill", function(d) { return color(d.group); });
                        
                        // Create a drag handler and append it to the node object instead
                        var drag_handler = d3.drag()
                          .on("start", dragstarted)
                          .on("drag", dragged)
                          .on("end", dragended);
                        
                        drag_handler(node);
                        
                        node.append("text")
                          .text(function(d) {
                            return d.id;
                          })
                          .attr("fill", '#ffffff')
                          .attr('x', 6)
                          .attr('y', 3);
                        
                        node.append("title")
                          .text(function(d) { return d.id; });
                        
                        simulation
                          .nodes(graph.nodes)
                          .on("tick", ticked);
                        
                        simulation.force("link")
                          .links(graph.edges);
                        
                          function ticked() {
                            //   link
                            //       .attr("x1", function(d) { return d.source.x; })
                            //       .attr("y1", function(d) { return d.source.y; })
                            //       .attr("x2", function(d) { return d.target.x; })
                            //       .attr("y2", function(d) { return d.target.y; });
                        
                            //   node
                            //       .attr("transform", function(d) {
                            //           return "translate(" + d.x + "," + d.y + ")";
                            //       })
                                  node.attr("transform", function(d) { 
                                      d.x = Math.max(radius, Math.min(width - radius, d.x));
                                      return "translate(" + d.x + "," + d.y + ")";
                                    })
                                  .attr("transform", function(d) { 
                                      d.y = Math.max(radius, Math.min(height - radius, d.y)); 
                                      return "translate(" + d.x + "," + d.y + ")";
                                    });
                          
                              link.attr("x1", function(d) { return d.source.x; })
                                  .attr("y1", function(d) { return d.source.y; })
                                  .attr("x2", function(d) { return d.target.x; })
                                  .attr("y2", function(d) { return d.target.y; });
                              }


                        
                        function dragstarted(d) {
                          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                          d.fx = d.x;
                          d.fy = d.y;
                        }
                        
                        function dragged(d) {
                          d.fx = d3.event.x;
                          d.fy = d3.event.y;
                        }
                        
                        function dragended(d) {
                          if (!d3.event.active) simulation.alphaTarget(0);
                          d.fx = null;
                          d.fy = null;
                        }
                        
                    });


                    $('.sample-box').click(() => {
                        $('.topic-container').append(
                            `
                            <div class="sample-detail animate__animated animate__fadeIn animate__faster">
                                <div class="close-sample">
                                    <span class="material-icons">
                                        highlight_off
                                    </span>
                                </div>
                                <div class="topic-name">
                                    <span style="font-size:11px; font-weight:normal;"> ${this.category} | Messages Sample </span>
                                    <div> ${this.series.name}</div>
                                </div>
                                    <div class="topic-content">
                                        <div class="topic-sentiments" style="width: 100%">
                                                ${topicMetadata.messages_sample.slice(0, 5).map((message) => {
                                                    return `
                                                        <div class="likes animate__animated animate__fadeIn animate__faster" style="animation-delay: 0.1s;">  
                                                            <span class="n-likes" style="font-size:14px; margin-top:16px;">
                                                                ${message}
                                                            </span>
                                                        </div>
                                                    `;
                                                }).join(' ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `
                        );
                        $('.close-sample').click(() => {
                            $('.sample-detail').removeClass('animate__fadeIn');
                            $('.sample-detail').addClass('animate__fadeOut');
                            setTimeout(() => {
                                $('.sample-detail').remove();
                            }, 500);
                        });
                    });

                    let wordcloudData = Object.entries(topicMetadata.word_count).map(([name, weight]) => { return {name, weight} })
                    
                    setTimeout(() => {
                        Highcharts.chart('topic-wordcloud', {
                            exporting: {
                                enabled: false
                            },
                            chart: {
                                backgroundColor: 'rgba(0,0,0,0)'
                            },
                            series: [{
                                type: 'wordcloud',
                                data: wordcloudData,
                                name: 'Occurrences'
                            }],
                            title: null
                        });
                    }, 500);
                }
            }
        }
      }
    },
    series: Object.values(topicsSeriesMap)
  });

  setTimeout(() => {
    $('.highcharts-xaxis-labels text').click(() => {
    })
  }, 3000);