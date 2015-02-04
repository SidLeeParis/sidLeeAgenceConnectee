exports.config = {
  app_name : ['sidlee'],
  license_key : '04cea5d92ca19be513ed5d480097151e6e8363e6',
  // 900 ms of resp time, is considered ok for this particular app
  apdex_t : 0.900,
  // ignore socket.io errors
  rules : {
    ignore : ['^/socket.io']
  },
  logging : {
    level : 'info'
  }
};
