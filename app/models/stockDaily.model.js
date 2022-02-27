module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      date: String,
      code: String,
      name: String,
      exchange: String,
      price: Number,
      change: Number,
      perChange: Number,
      mTotalVol: Number,
      mTotalVal: Number,
      marketCap: Number,
      daily: Array,
      pattern: Array
    },
    { timestamps: true },
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const StockDaily = mongoose.model("StockDaily", schema, 'StockDaily');
  return StockDaily;
};