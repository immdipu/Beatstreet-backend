const users = [
  { id: 1, userFavoriteSong: ["song1", "song2", "song3"] },
  { id: 2, userFavoriteSong: ["song2", "song4", "song5"] },
  { id: 3, userFavoriteSong: ["song1", "song3", "song5"] },
  { id: 4, userFavoriteSong: ["song1", "song2", "song3", "song4"] },
  { id: 5, userFavoriteSong: ["song4", "song5"] },
];

const findUsers = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return users;
};

const calculateSimilarity = async (song1, song2, users) => {
  try {
    const usersWithBothSongs = users.filter(
      (user) =>
        user.userFavoriteSong.includes(song1) &&
        user.userFavoriteSong.includes(song2)
    );
    const similarity = usersWithBothSongs.length / users.length;
    return similarity;
  } catch (error) {
    console.error("Error calculating similarity:", error);
    throw error;
  }
};

const generateRecommendations = async (user, users) => {
  try {
    const recommendations = [];
    for (const favoriteSong of user?.userFavoriteSong) {
      for (const otherUser of users) {
        if (otherUser?.favoriteSong && otherUser.favoriteSong.length === 0)
          continue;
        for (const otherUserFavoriteSong of otherUser?.userFavoriteSong) {
          if (otherUserFavoriteSong !== favoriteSong) {
            const similarity = await calculateSimilarity(
              favoriteSong,
              otherUserFavoriteSong,
              users
            );
            console.log(
              "Similarity between",
              favoriteSong,
              "and",
              otherUserFavoriteSong,
              "is",
              similarity
            );

            if (similarity >= 0.5) {
              if (
                !user.userFavoriteSong.includes(otherUserFavoriteSong) &&
                !recommendations.includes(otherUserFavoriteSong)
              ) {
                recommendations.push(otherUserFavoriteSong);
              }
            }
          }
        }
      }
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
};

const testRecommendations = async () => {
  const user = { userFavoriteSong: ["song1", "song2"] };

  try {
    // Simulate fetching users from database
    const users = await findUsers();

    // Generate recommendations for the test user
    const recommendations = await generateRecommendations(user, users);

    console.log("Recommendations for user:", recommendations);

    console.log("expected output: [ 'song3', 'song4', 'song5' ] ");
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = generateRecommendations;
