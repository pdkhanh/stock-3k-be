module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      code: String,
      addedDate: String,
      perChange: Number,
      change: Number,
      initPrice: Number,
      currentPrice: Number,
      currentChange: Number,
      currentPerChange: Number
    },
    { timestamps: true },
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Treasure = mongoose.model("Treasure", schema, 'Treasure');
  return Treasure;
};