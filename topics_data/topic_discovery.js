let liwc_meaning = {
    social: "Speech contains social concerns",
    anger: "Speech contains anger",
    sad: "Speech contains sadness",
    time: "Speech refering to time itself"
}

let real_world = {
    'Seth Rich': [
        'https://www.washingtonpost.com/news/the-fix/wp/2017/05/20/the-seth-rich-conspiracy-shows-how-fake-news-still-works/',
        'https://www.wired.com/2017/05/seth-rich-filter-bubble/'
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
        if (!(topic.topic_real_title in topicsSeriesMap)){
            topicsSeriesMap[topic.topic_real_title] = {
                name: topic.topic_real_title,
                data: [],
                metadata: {}
            }
            allTopics.push(topic.topic_real_title);
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
        topicsSeriesMap[topic.topic_real_title].data.push(topic.score_total);
        topicsSeriesMap[topic.topic_real_title].metadata[period.period] = {...topic};
        topicsOnPeriod.push(topic.topic_real_title);
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
      text: 'What is GAB talking about? (Based on Topic Discovery)'
    },
    subtitle: {
      text: 'Analyzing Gab discovered topics & sentiments through time [Click on a column to see detailed information]'
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
                    let sentimentIcon = vaderSentiment < 0.20 ? 'sentiment_very_dissatisfied' : (vaderSentiment > 0.20) ? 'sentiment_satisfied_alt' : 'sentiment_neutral';
                    let sentimentText = vaderSentiment < 0.20 ? 'Overall negative' : (vaderSentiment > 0.20) ? 'Overall positive' : 'Overall neutral';
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


                                            <div class="sample-box animate__animated animate__fadeIn animate__faster"> 
                                                <button class="action-button">
                                                    ${"SEE MESSAGES"}
                                                </button>
                                            </div>
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
        console.log($(this).attr("y"));
    })
  }, 3000);