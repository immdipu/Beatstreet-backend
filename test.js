const axios = require("axios");

const getAllHomepagesongs = async () => {
  const res = await axios.get(
    "https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&__call=webapi.getLaunchData"
  );

  console.log(res.data.new_trending);
};

getAllHomepagesongs();
